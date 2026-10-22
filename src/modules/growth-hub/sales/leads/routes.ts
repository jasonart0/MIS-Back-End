import { Router } from "express";
import { requireWriteAccess } from "../../../../core/middleware/write-access.js";
import { asyncHandler } from "../../../../core/http/errors.js";
import { validateBody, validateParams, validateQuery } from "../../../../core/http/validation.js";
import {
  createLeadActivitySchema,
  createLeadSchema,
  leadIdSchema,
  listLeadsSchema,
  updateLeadSchema,
} from "./schemas.js";
import * as controller from "./controller.js";

export const leadsRouter = Router();

leadsRouter.get("/", validateQuery(listLeadsSchema), asyncHandler(controller.list));
leadsRouter.get("/:id", validateParams(leadIdSchema), asyncHandler(controller.get));
leadsRouter.post(
  "/",
  requireWriteAccess,
  validateBody(createLeadSchema),
  asyncHandler(controller.create),
);
leadsRouter.patch(
  "/:id",
  requireWriteAccess,
  validateParams(leadIdSchema),
  validateBody(updateLeadSchema),
  asyncHandler(controller.update),
);
leadsRouter.delete(
  "/:id",
  requireWriteAccess,
  validateParams(leadIdSchema),
  asyncHandler(controller.remove),
);
leadsRouter.get(
  "/:id/activities",
  validateParams(leadIdSchema),
  asyncHandler(controller.activities),
);
leadsRouter.post(
  "/:id/activities",
  requireWriteAccess,
  validateParams(leadIdSchema),
  validateBody(createLeadActivitySchema),
  asyncHandler(controller.createActivity),
);
