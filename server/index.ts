import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { sameOriginApiGuard, securityHeaders } from "./security";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false, limit: "32kb" }));

app.use(securityHeaders);
app.use(sameOriginApiGuard);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      if (logLine.length > 120) {
        logLine = `${logLine.slice(0, 119)}…`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("[server] Unhandled error:", err);
    res.status(status).json({ message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || 5000);
  const host =
    process.env.HOST || (app.get("env") === "development" ? "127.0.0.1" : "0.0.0.0");

  server.listen(port, host, () => {
    log(`serving on http://${host}:${port}`);
  });

  const gracefulShutdown = (signal: string) => {
    log(`Received ${signal}, shutting down gracefully...`);
    server.close(() => {
      log("HTTP server closed");
      process.exit(0);
    });

    setTimeout(() => {
      log("Could not close connections in time, forcefully shutting down");
      process.exit(1);
    }, 30000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
})();
