import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { z } from "zod";
import fetch from "node-fetch";
import createMemoryStore from "memorystore";
import { BackupService } from "./backup";
import { ConfigStore } from "./config-store";
import { safeCompareSecret } from "./security";
import type {
  ExecutionStatus,
  N8nConfig,
  N8nConfigState,
  Workflow,
  WorkflowExecution,
} from "@shared/schema";

declare module 'express-session' {
  interface SessionData {
    authenticated?: boolean;
  }
}

const MemoryStore = createMemoryStore(session);
const executionStatusSchema = z.enum([
  "success",
  "error",
  "running",
  "waiting",
  "canceled",
  "crashed",
  "new",
]);
const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});
const n8nUrlSchema = z.string().trim().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "n8n URL must use HTTP or HTTPS.");
const configSchema = z.object({
  url: n8nUrlSchema,
  apiKey: z.string().trim().optional().default(""),
});
const executionsQuerySchema = z.object({
  workflowId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  status: executionStatusSchema.optional(),
});

const AUTH_WINDOW_MS = 10 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 10;

function trimTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

function hasCompleteConfig(config: N8nConfig): boolean {
  return Boolean(config.url && config.apiKey);
}

function getClientKey(req: Request) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

async function fetchJson<T>(
  url: string,
  init: Parameters<typeof fetch>[1] = {},
  timeoutMs = 10_000
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    return await response.json() as T;
  } finally {
    clearTimeout(timeout);
  }
}

function mapWorkflow(workflow: Record<string, any>): Workflow {
  return {
    id: String(workflow.id),
    name: String(workflow.name ?? "Untitled workflow"),
    description: typeof workflow.description === "string" ? workflow.description : "",
    active: Boolean(workflow.active),
    createdAt: typeof workflow.createdAt === "string" ? workflow.createdAt : undefined,
    updatedAt: typeof workflow.updatedAt === "string" ? workflow.updatedAt : undefined,
  };
}

function mapExecution(execution: Record<string, any>, workflowName?: string): WorkflowExecution {
  return {
    id: String(execution.id),
    workflowId: String(execution.workflowId),
    workflowName,
    mode: typeof execution.mode === "string" ? execution.mode : "unknown",
    status: executionStatusSchema.catch("new").parse(execution.status) as ExecutionStatus,
    startedAt: String(execution.startedAt),
    stoppedAt: typeof execution.stoppedAt === "string" ? execution.stoppedAt : undefined,
    duration:
      execution.stoppedAt && execution.startedAt
        ? new Date(execution.stoppedAt).getTime() - new Date(execution.startedAt).getTime()
        : undefined,
    retryOf: typeof execution.retryOf === "string" ? execution.retryOf : undefined,
    retrySuccessId: typeof execution.retrySuccessId === "string" ? execution.retrySuccessId : undefined,
    error:
      execution.status === "error"
        ? execution.data?.resultData?.error?.message || "Unknown error"
        : undefined,
    data: execution.data,
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  const appPassword = process.env.APP_PASSWORD?.trim();
  if (!appPassword || appPassword.length < 8) {
    throw new Error("APP_PASSWORD must be set and at least 8 characters long.");
  }

  const configStore = new ConfigStore();
  const persistedConfig = await configStore.load();
  const envConfigLocked = Boolean(process.env.N8N_URL?.trim() || process.env.N8N_API_KEY?.trim());

  let n8nConfig: N8nConfig = {
    url: trimTrailingSlash(process.env.N8N_URL?.trim() || persistedConfig?.url || ""),
    apiKey: process.env.N8N_API_KEY?.trim() || persistedConfig?.apiKey || "",
  };

  let backupService: BackupService | null = null;
  if (hasCompleteConfig(n8nConfig)) {
    backupService = new BackupService(n8nConfig);
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error(
      "SESSION_SECRET environment variable must be set to a random string of at least 32 characters. Generate one with: openssl rand -base64 32"
    );
  }

  app.use(
    session({
      secret: sessionSecret,
      proxy: true,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: "auto",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
      store: new MemoryStore({
        checkPeriod: 86400000,
        ttl: 24 * 60 * 60 * 1000,
        stale: false,
      }),
      name: "achtlet.session.id",
      rolling: true,
    })
  );

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: "achtlet",
    });
  });

  app.get("/api/ready", async (_req, res) => {
    try {
      if (hasCompleteConfig(n8nConfig)) {
        await fetchJson(`${n8nConfig.url}/api/v1/workflows`, {
          headers: { "X-N8N-API-KEY": n8nConfig.apiKey },
        }, 5000);
      }

      res.status(200).json({ status: "ready" });
    } catch (error) {
      res.status(503).json({
        status: "not_ready",
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.authenticated) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  const requireConfigured = (_req: Request, res: Response, next: NextFunction) => {
    if (hasCompleteConfig(n8nConfig)) {
      return next();
    }

    res.status(400).json({ message: "N8N connection is not configured yet." });
  };

  const authAttempts = new Map<string, { count: number; windowStartedAt: number }>();

  const getRetryAfterSeconds = (req: Request) => {
    const attemptState = authAttempts.get(getClientKey(req));
    if (!attemptState) {
      return 0;
    }

    return Math.max(
      1,
      Math.ceil((attemptState.windowStartedAt + AUTH_WINDOW_MS - Date.now()) / 1000),
    );
  };

  const isLoginThrottled = (req: Request) => {
    const attemptState = authAttempts.get(getClientKey(req));
    if (!attemptState) {
      return false;
    }

    if (Date.now() - attemptState.windowStartedAt > AUTH_WINDOW_MS) {
      authAttempts.delete(getClientKey(req));
      return false;
    }

    return attemptState.count >= AUTH_MAX_ATTEMPTS;
  };

  const registerFailedLogin = (req: Request) => {
    const key = getClientKey(req);
    const previous = authAttempts.get(key);

    if (!previous || Date.now() - previous.windowStartedAt > AUTH_WINDOW_MS) {
      authAttempts.set(key, {
        count: 1,
        windowStartedAt: Date.now(),
      });
      return;
    }

    authAttempts.set(key, {
      ...previous,
      count: previous.count + 1,
    });
  };

  const resetLoginAttempts = (req: Request) => {
    authAttempts.delete(getClientKey(req));
  };

  const getConfigState = (): N8nConfigState => ({
    url: n8nConfig.url,
    configured: hasCompleteConfig(n8nConfig),
    apiKeyConfigured: Boolean(n8nConfig.apiKey),
    locked: envConfigLocked,
    source: envConfigLocked ? "environment" : hasCompleteConfig(n8nConfig) ? "file" : "unset",
  });

  app.post("/api/auth/login", async (req, res) => {
    if (isLoginThrottled(req)) {
      const retryAfter = getRetryAfterSeconds(req);
      res.setHeader("Retry-After", retryAfter.toString());
      return res.status(429).json({ message: "Too many failed login attempts. Try again later." });
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Password is required." });
    }

    if (!safeCompareSecret(appPassword, parsed.data.password)) {
      registerFailedLogin(req);
      return res.status(401).json({ message: "Invalid password" });
    }

    resetLoginAttempts(req);

    req.session.regenerate((error) => {
      if (error) {
        return res.status(500).json({ message: "Failed to create session" });
      }

      req.session.authenticated = true;
      res.status(200).json({ success: true });
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ message: "Failed to logout" });
      } else {
        res.clearCookie("achtlet.session.id");
        res.status(200).json({ success: true });
      }
    });
  });

  app.get("/api/auth/status", (req, res) => {
    if (req.session.authenticated) {
      res.status(200).json({ authenticated: true });
    } else {
      res.status(200).json({ authenticated: false });
    }
  });

  app.get("/api/config", isAuthenticated, (_req, res) => {
    res.status(200).json(getConfigState());
  });

  app.post("/api/config", isAuthenticated, async (req, res) => {
    if (envConfigLocked) {
      return res.status(409).json({
        message: "N8N config is locked by environment variables and cannot be changed in the UI.",
      });
    }

    try {
      const validatedData = configSchema.parse(req.body);
      const nextConfig: N8nConfig = {
        url: trimTrailingSlash(validatedData.url),
        apiKey: validatedData.apiKey || n8nConfig.apiKey,
      };

      if (!nextConfig.apiKey) {
        return res.status(400).json({ message: "API key is required." });
      }

      await fetchJson(`${nextConfig.url}/api/v1/workflows`, {
        headers: {
          "X-N8N-API-KEY": nextConfig.apiKey,
        },
      });

      await configStore.save(nextConfig);
      n8nConfig = nextConfig;

      if (backupService) {
        backupService.updateConfig(n8nConfig);
      } else {
        backupService = new BackupService(n8nConfig);
      }

      res.status(200).json({
        success: true,
        config: getConfigState(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: error.issues[0]?.message ?? "Invalid configuration",
        });
      }

      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid configuration" });
    }
  });

  app.get("/api/status", isAuthenticated, async (req, res) => {
    if (!hasCompleteConfig(n8nConfig)) {
      return res.status(200).json({
        connected: false,
        configured: false,
        source: getConfigState().source,
      });
    }

    try {
      await fetchJson(`${n8nConfig.url}/api/v1/workflows`, {
        headers: {
          "X-N8N-API-KEY": n8nConfig.apiKey,
        },
      });

      res.status(200).json({
        connected: true,
        configured: true,
        source: getConfigState().source,
      });
    } catch (error) {
      res.status(200).json({
        connected: false,
        configured: true,
        source: getConfigState().source,
      });
    }
  });

  app.get("/api/workflows", isAuthenticated, requireConfigured, async (req, res) => {
    try {
      const data = await fetchJson<{ data: Array<Record<string, any>> }>(`${n8nConfig.url}/api/v1/workflows`, {
        headers: {
          "X-N8N-API-KEY": n8nConfig.apiKey,
        },
      });

      res.status(200).json(data.data.map(mapWorkflow));
    } catch (error) {
      console.error("Error fetching workflows:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch workflows" });
    }
  });

  app.get("/api/executions", isAuthenticated, requireConfigured, async (req, res) => {
    try {
      const parsedQuery = executionsQuerySchema.parse(req.query);
      const queryParams = new URLSearchParams();
      if (parsedQuery.workflowId) queryParams.append("workflowId", parsedQuery.workflowId);
      queryParams.append("limit", parsedQuery.limit.toString());
      if (parsedQuery.status) queryParams.append("status", parsedQuery.status);

      const data = await fetchJson<{ data: Array<Record<string, any>> }>(`${n8nConfig.url}/api/v1/executions?${queryParams}`, {
        headers: {
          "X-N8N-API-KEY": n8nConfig.apiKey,
        },
      });

      const workflowsData = await fetchJson<{ data: Array<Record<string, any>> }>(`${n8nConfig.url}/api/v1/workflows`, {
        headers: {
          "X-N8N-API-KEY": n8nConfig.apiKey,
        },
      });

      const workflowNames = workflowsData.data.reduce((acc, workflow) => {
        acc[String(workflow.id)] = String(workflow.name ?? "Unknown Workflow");
        return acc;
      }, {} as Record<string, string>);

      res.status(200).json(
        data.data.map((execution) => mapExecution(execution, workflowNames[String(execution.workflowId)] || "Unknown Workflow")),
      );
    } catch (error) {
      console.error("Error fetching executions:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch executions" });
    }
  });

  app.get("/api/executions/:id", isAuthenticated, requireConfigured, async (req, res) => {
    try {
      const { id } = req.params;
      const execution = await fetchJson<Record<string, any>>(`${n8nConfig.url}/api/v1/executions/${id}`, {
        headers: {
          "X-N8N-API-KEY": n8nConfig.apiKey,
        },
      });

      let workflowName = "Unknown Workflow";
      try {
        const workflow = await fetchJson<Record<string, any>>(`${n8nConfig.url}/api/v1/workflows/${execution.workflowId}`, {
          headers: {
            "X-N8N-API-KEY": n8nConfig.apiKey,
          },
        });

        workflowName = typeof workflow.name === "string" ? workflow.name : workflowName;
      } catch (error) {
        console.warn("Could not fetch workflow name:", error);
      }

      res.status(200).json(mapExecution(execution, workflowName));
    } catch (error) {
      console.error("Error fetching execution:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch execution" });
    }
  });

  app.patch("/api/workflows/:id", isAuthenticated, requireConfigured, async (req, res) => {
    try {
      const { id } = req.params;
      const parsedBody = z.object({ active: z.boolean() }).safeParse(req.body);
      if (!parsedBody.success) {
        return res.status(400).json({ message: "Active status must be a boolean" });
      }

      const activationEndpoint = `${n8nConfig.url}/api/v1/workflows/${id}/${parsedBody.data.active ? "activate" : "deactivate"}`;

      await fetchJson(activationEndpoint, {
        method: "POST",
        headers: {
          "X-N8N-API-KEY": n8nConfig.apiKey,
          "Content-Type": "application/json",
        },
      });

      const updatedWorkflow = await fetchJson<Record<string, any>>(`${n8nConfig.url}/api/v1/workflows/${id}`, {
        headers: {
          "X-N8N-API-KEY": n8nConfig.apiKey,
        },
      });

      res.status(200).json(mapWorkflow(updatedWorkflow));
    } catch (error) {
      console.error("Error updating workflow:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to update workflow" });
    }
  });

  app.get("/api/backups", isAuthenticated, requireConfigured, async (req, res) => {
    try {
      if (!backupService) {
        return res.status(400).json({ message: "Backup service not initialized. Please configure N8N connection first." });
      }

      const backups = await backupService.getBackups();
      res.status(200).json(backups);
    } catch (error) {
      console.error("Error fetching backups:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to fetch backups" });
    }
  });

  app.post("/api/backups", isAuthenticated, requireConfigured, async (req, res) => {
    try {
      if (!backupService) {
        return res.status(400).json({ message: "Backup service not initialized. Please configure N8N connection first." });
      }

      const backup = await backupService.createBackup();
      res.status(201).json(backup);
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create backup" });
    }
  });

  app.get("/api/backups/:id/download", isAuthenticated, requireConfigured, async (req, res) => {
    try {
      if (!backupService) {
        return res.status(400).json({ message: "Backup service not initialized. Please configure N8N connection first." });
      }

      const { id } = req.params;
      const backup = await backupService.getBackupDownload(id);
      if (!backup) {
        return res.status(404).json({ message: "Backup not found" });
      }

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${backup.filename}"`);
      res.sendFile(backup.path);
    } catch (error) {
      console.error("Error downloading backup:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to download backup" });
    }
  });

  app.delete("/api/backups/:id", isAuthenticated, requireConfigured, async (req, res) => {
    try {
      if (!backupService) {
        return res.status(400).json({ message: "Backup service not initialized. Please configure N8N connection first." });
      }

      const { id } = req.params;
      const success = await backupService.deleteBackup(id);
      
      if (!success) {
        return res.status(404).json({ message: "Backup not found" });
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting backup:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to delete backup" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
