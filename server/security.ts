import { createHash, timingSafeEqual } from "crypto";
import type { Request, RequestHandler } from "express";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
].join("; ");

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest();
}

function requestOrigin(req: Request) {
  const host = req.get("host");
  if (!host) {
    return undefined;
  }

  return new URL(`${req.protocol}://${host}`).origin;
}

export function safeCompareSecret(expected: string, actual: string) {
  return timingSafeEqual(sha256(expected), sha256(actual));
}

export const securityHeaders: RequestHandler = (req, res, next) => {
  res.setHeader("Content-Security-Policy", CONTENT_SECURITY_POLICY);
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (req.path.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Pragma", "no-cache");
  }

  next();
};

export const sameOriginApiGuard: RequestHandler = (req, res, next) => {
  if (!req.path.startsWith("/api/") || SAFE_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.get("origin");
  if (!origin) {
    return next();
  }

  const expectedOrigin = requestOrigin(req);
  let parsedOrigin: string;
  try {
    parsedOrigin = new URL(origin).origin;
  } catch {
    return res.status(403).json({ message: "Cross-origin API request blocked." });
  }

  if (!expectedOrigin || parsedOrigin !== expectedOrigin) {
    return res.status(403).json({ message: "Cross-origin API request blocked." });
  }

  next();
};
