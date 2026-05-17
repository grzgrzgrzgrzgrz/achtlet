import express from "express";
import fs from "fs/promises";
import os from "os";
import path from "path";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { registerRoutes } from "./routes";

const originalEnv = { ...process.env };
const cleanupDirs: string[] = [];

async function createRoutesApp() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "achtlet-routes-"));
  cleanupDirs.push(dataDir);

  process.env = {
    ...originalEnv,
    APP_PASSWORD: "test-password",
    SESSION_SECRET: "test-session-secret-with-at-least-32-chars",
    DATA_DIR: dataDir,
    N8N_URL: "",
    N8N_API_KEY: "",
  };

  const app = express();
  app.use(express.json({ limit: "32kb" }));
  app.use(express.urlencoded({ extended: false, limit: "32kb" }));

  const server = await registerRoutes(app);

  return { app, server };
}

afterEach(async () => {
  process.env = { ...originalEnv };

  await Promise.all(
    cleanupDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

describe("auth status route", () => {
  it("returns an unauthenticated status without creating browser console errors", async () => {
    const { app, server } = await createRoutesApp();

    try {
      const response = await request(app).get("/api/auth/status").expect(200);

      expect(response.body).toEqual({ authenticated: false });
    } finally {
      server.close();
    }
  });
});

describe("n8n config route", () => {
  it("rejects non-http n8n URLs before attempting an upstream request", async () => {
    const { app, server } = await createRoutesApp();
    const agent = request.agent(app);

    try {
      await agent
        .post("/api/auth/login")
        .send({ password: "test-password" })
        .expect(200);

      const response = await agent
        .post("/api/config")
        .send({ url: "ftp://n8n.example.test", apiKey: "test-key" })
        .expect(400);

      expect(response.body.message).toContain("HTTP or HTTPS");
    } finally {
      server.close();
    }
  });
});
