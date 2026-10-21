import "dotenv/config";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./core/database/prisma.js";

const server = app.listen(env.PORT, () => {
  console.info(`MIS backend listening on port ${env.PORT} (${env.NODE_ENV}).`);
  if (env.NODE_ENV === "development" && env.ALLOW_UNAUTHENTICATED_WRITES) {
    console.warn("Unauthenticated write operations are enabled for local development only.");
  }
});

const shutdown = async (signal: string) => {
  console.info(`${signal} received; shutting down.`);
  server.close(async (error) => {
    await prisma.$disconnect();
    if (error) {
      console.error("HTTP server shutdown failed", error);
      process.exitCode = 1;
    }
  });
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
