import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { asyncHandler, errorHandler, HttpError } from "./core/http/errors.js";
import { prisma } from "./core/database/prisma.js";
import { requireSalesAccess } from "./core/middleware/write-access.js";
import { leadsRouter } from "./modules/growth-hub/sales/leads/routes.js";
import { tasksRouter } from "./modules/growth-hub/sales/tasks/routes.js";

export const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.get(
  "/api/health/database",
  asyncHandler(async (_request, response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      response.status(200).json({ status: "ok", database: "connected" });
    } catch {
      response.status(503).json({
        error: { code: "database_unavailable", message: "Database connectivity check failed." },
      });
    }
  }),
);

const salesRouter = express.Router();
salesRouter.use(requireSalesAccess);
salesRouter.use("/leads", leadsRouter);
salesRouter.use("/tasks", tasksRouter);
app.use("/api/growth-hub/sales", salesRouter);

app.use((_request, _response, next) => {
  next(new HttpError(404, "not_found", "The requested endpoint was not found."));
});
app.use(errorHandler);
