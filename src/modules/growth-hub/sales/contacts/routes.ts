import { Router } from "express";
import { asyncHandler } from "../../../../core/http/errors.js";
import { requireWriteAccess } from "../../../../core/middleware/write-access.js";
import { validateBody, validateParams, validateQuery } from "../../../../core/http/validation.js";
import {
  contactIdSchema,
  createContactActivitySchema,
  createContactSchema,
  listContactsSchema,
  updateContactSchema,
} from "./schemas.js";
import * as controller from "./controller.js";

export const contactsRouter = Router();

contactsRouter.get("/", validateQuery(listContactsSchema), asyncHandler(controller.list));
contactsRouter.get("/:id", validateParams(contactIdSchema), asyncHandler(controller.get));
contactsRouter.post(
  "/",
  requireWriteAccess,
  validateBody(createContactSchema),
  asyncHandler(controller.create),
);
contactsRouter.patch(
  "/:id",
  requireWriteAccess,
  validateParams(contactIdSchema),
  validateBody(updateContactSchema),
  asyncHandler(controller.update),
);
contactsRouter.delete(
  "/:id",
  requireWriteAccess,
  validateParams(contactIdSchema),
  asyncHandler(controller.remove),
);
contactsRouter.get(
  "/:id/activities",
  validateParams(contactIdSchema),
  asyncHandler(controller.activities),
);
contactsRouter.post(
  "/:id/activities",
  requireWriteAccess,
  validateParams(contactIdSchema),
  validateBody(createContactActivitySchema),
  asyncHandler(controller.createActivity),
);
