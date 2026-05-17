import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  sameOriginApiGuard,
  safeCompareSecret,
  securityHeaders,
} from "./security";

function createTestApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(express.json());
  app.use(securityHeaders);
  app.use(sameOriginApiGuard);
  app.get("/api/data", (_req, res) => res.status(200).json({ ok: true }));
  app.post("/api/mutate", (_req, res) => res.status(200).json({ ok: true }));
  app.get("/dashboard", (_req, res) => res.status(200).send("<main>Achtlet</main>"));

  return app;
}

describe("security middleware", () => {
  it("sets hardened browser headers and disables API caching", async () => {
    const response = await request(createTestApp()).get("/api/data").expect(200);

    expect(response.headers["content-security-policy"]).toContain("default-src 'self'");
    expect(response.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(response.headers["referrer-policy"]).toBe("no-referrer");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("DENY");
    expect(response.headers["permissions-policy"]).toBe("camera=(), microphone=(), geolocation=()");
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.headers.pragma).toBe("no-cache");
  });

  it("rejects cross-origin state-changing API requests", async () => {
    const response = await request(createTestApp())
      .post("/api/mutate")
      .set("Host", "achtlet.example.test")
      .set("X-Forwarded-Proto", "https")
      .set("Origin", "https://evil.example")
      .send({ active: true })
      .expect(403);

    expect(response.body).toEqual({ message: "Cross-origin API request blocked." });
  });

  it("rejects malformed browser origins without throwing", async () => {
    const response = await request(createTestApp())
      .post("/api/mutate")
      .set("Host", "achtlet.example.test")
      .set("Origin", "not a url")
      .send({ active: true })
      .expect(403);

    expect(response.body).toEqual({ message: "Cross-origin API request blocked." });
  });

  it("allows same-origin and non-browser state-changing API requests", async () => {
    await request(createTestApp())
      .post("/api/mutate")
      .set("Host", "achtlet.example.test")
      .set("X-Forwarded-Proto", "https")
      .set("Origin", "https://achtlet.example.test")
      .send({ active: true })
      .expect(200);

    await request(createTestApp())
      .post("/api/mutate")
      .set("Host", "achtlet.example.test")
      .send({ active: true })
      .expect(200);
  });
});

describe("safeCompareSecret", () => {
  it("compares secrets without leaking equality through string length handling", () => {
    expect(safeCompareSecret("strong-password", "strong-password")).toBe(true);
    expect(safeCompareSecret("strong-password", "wrong-password")).toBe(false);
    expect(safeCompareSecret("strong-password", "short")).toBe(false);
  });
});
