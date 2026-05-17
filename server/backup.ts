import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import archiver from "archiver";
import cron from "node-cron";
import fetch from "node-fetch";
import type { Backup, N8nConfig } from "@shared/schema";

interface BackupRecord extends Backup {
  path: string;
}

const FALLBACK_WORKFLOW_NAME = "workflow";

function sanitizeArchiveName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || FALLBACK_WORKFLOW_NAME;
}

export class BackupService {
  private backupDir: string;
  private maxBackups: number;
  private n8nConfig: N8nConfig;

  constructor(n8nConfig: N8nConfig) {
    this.backupDir =
      process.env.BACKUP_DIR ||
      (process.env.NODE_ENV === "production"
        ? "/app/backups"
        : path.join(process.cwd(), "backups"));
    this.maxBackups = Number.parseInt(process.env.BACKUP_KEEP_LAST ?? "10", 10) || 10;
    this.n8nConfig = n8nConfig;
    void this.ensureBackupDirectory();
    this.scheduleBackups();
  }

  private async ensureBackupDirectory() {
    try {
      await fsPromises.access(this.backupDir);
    } catch {
      await fsPromises.mkdir(this.backupDir, { recursive: true });
    }
  }

  private scheduleBackups() {
    const timezone = process.env.TZ || "UTC";

    cron.schedule("0 2 * * *", async () => {
      try {
        await this.createBackup();
        await this.cleanupOldBackups();
      } catch (error) {
        console.error("[BackupService] Scheduled backup failed:", error);
      }
    }, {
      timezone,
    });
  }

  async createBackup(): Promise<Backup> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `n8n-backup-${timestamp}.zip`;
    const backupPath = path.join(this.backupDir, filename);

    try {
      const workflowsResponse = await fetch(`${this.n8nConfig.url}/api/v1/workflows`, {
        headers: {
          "X-N8N-API-KEY": this.n8nConfig.apiKey,
        },
      });

      if (!workflowsResponse.ok) {
        throw new Error(`Failed to fetch workflows: ${workflowsResponse.status}`);
      }

      const workflowsData = await workflowsResponse.json() as { data: Array<Record<string, any>> };

      const executionsResponse = await fetch(`${this.n8nConfig.url}/api/v1/executions?limit=1000`, {
        headers: {
          "X-N8N-API-KEY": this.n8nConfig.apiKey,
        },
      });

      let executionsData: { data: Array<Record<string, any>> } = { data: [] };
      if (executionsResponse.ok) {
        executionsData = await executionsResponse.json() as { data: Array<Record<string, any>> };
      }

      const backupData = {
        metadata: {
          created: new Date().toISOString(),
          version: "1.1",
          source: "achtlet",
          workflowCount: workflowsData.data.length,
          executionCount: executionsData.data.length,
        },
        workflows: workflowsData.data,
        executions: executionsData.data,
      };

      const output = fs.createWriteStream(backupPath, { mode: 0o600 });
      const archive = archiver("zip", { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on("close", async () => {
          try {
            const stats = await fsPromises.stat(backupPath);
            resolve({
              id: timestamp,
              filename,
              createdAt: new Date().toISOString(),
              size: stats.size,
              workflowCount: workflowsData.data.length,
              executionCount: executionsData.data.length,
            });
          } catch (error) {
            reject(error);
          }
        });

        output.on("error", reject);
        archive.on("error", reject);
        archive.pipe(output);

        archive.append(JSON.stringify(backupData, null, 2), { name: "backup.json" });

        workflowsData.data.forEach((workflow, index) => {
          const safeName = sanitizeArchiveName(String(workflow.name || `${FALLBACK_WORKFLOW_NAME}-${index}`));

          archive.append(JSON.stringify(workflow, null, 2), {
            name: `workflows/${safeName}.json`,
          });
        });

        if (executionsData.data.length > 0) {
          archive.append(JSON.stringify(executionsData.data, null, 2), {
            name: "executions/executions.json",
          });
        }

        void archive.finalize();
      });
    } catch (error) {
      try {
        await fsPromises.unlink(backupPath);
      } catch {}
      throw error;
    }
  }

  async getBackups(): Promise<Backup[]> {
    const records = await this.listBackupRecords();
    return records.map(({ path: _path, ...backup }) => backup);
  }

  async getBackupDownload(backupId: string): Promise<{ filename: string; path: string } | null> {
    const backups = await this.listBackupRecords();
    const backup = backups.find((item) => item.id === backupId);

    if (!backup) {
      return null;
    }

    return {
      filename: backup.filename,
      path: backup.path,
    };
  }

  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backup = await this.getBackupDownload(backupId);
      if (!backup) {
        return false;
      }

      await fsPromises.unlink(backup.path);
      return true;
    } catch (error) {
      console.error(`[BackupService] Failed to delete backup ${backupId}:`, error);
      return false;
    }
  }

  private async cleanupOldBackups() {
    try {
      const backups = await this.listBackupRecords();

      if (backups.length > this.maxBackups) {
        const backupsToDelete = backups.slice(this.maxBackups);

        for (const backup of backupsToDelete) {
          try {
            await fsPromises.unlink(backup.path);
          } catch (error) {
            console.warn(`[BackupService] Failed to delete old backup ${backup.filename}:`, error);
          }
        }
      }
    } catch (error) {
      console.error("[BackupService] Failed to cleanup old backups:", error);
    }
  }

  private async listBackupRecords(): Promise<BackupRecord[]> {
    try {
      const files = await fsPromises.readdir(this.backupDir);
      const backupFiles = files.filter((file) => file.endsWith(".zip") && file.startsWith("n8n-backup-"));
      const backups: BackupRecord[] = [];

      for (const filename of backupFiles) {
        try {
          const filePath = path.join(this.backupDir, filename);
          const stats = await fsPromises.stat(filePath);
          const timestampMatch = filename.match(/n8n-backup-(.+)\.zip$/);
          const timestamp = timestampMatch ? timestampMatch[1] : filename;

          backups.push({
            id: timestamp,
            filename,
            createdAt: stats.birthtime.toISOString(),
            size: stats.size,
            workflowCount: -1,
            executionCount: -1,
            path: filePath,
          });
        } catch (error) {
          console.warn(`[BackupService] Failed to inspect backup ${filename}:`, error);
        }
      }

      return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error("[BackupService] Failed to read backups directory:", error);
      return [];
    }
  }

  updateConfig(n8nConfig: N8nConfig) {
    this.n8nConfig = n8nConfig;
  }
}
