import fs from "fs/promises";
import path from "path";
import type { N8nConfig } from "@shared/schema";

const CONFIG_FILENAME = "config.json";

function getDefaultDataDir() {
  if (process.env.DATA_DIR) {
    return process.env.DATA_DIR;
  }

  return process.env.NODE_ENV === "production"
    ? "/app/data"
    : path.join(process.cwd(), ".data");
}

export class ConfigStore {
  private readonly dataDir = getDefaultDataDir();
  private readonly configPath = path.join(this.dataDir, CONFIG_FILENAME);

  async load(): Promise<N8nConfig | undefined> {
    try {
      const raw = await fs.readFile(this.configPath, "utf-8");
      const parsed = JSON.parse(raw) as Partial<N8nConfig>;

      if (!parsed.url || !parsed.apiKey) {
        return undefined;
      }

      return {
        url: parsed.url,
        apiKey: parsed.apiKey,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return undefined;
      }

      throw error;
    }
  }

  async save(config: N8nConfig) {
    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), {
      encoding: "utf-8",
      mode: 0o600,
    });
  }
}
