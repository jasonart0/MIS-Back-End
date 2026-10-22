import { Router } from "express";
import { asyncHandler } from "../../../../core/http/errors.js";
import { requireWriteAccess } from "../../../../core/middleware/write-access.js";
import { validateBody, validateParams, validateQuery } from "../../../../core/http/validation.js";
import { nestedIdParamsSchema } from "../../../../core/http/schemas.js";
import {
  attachmentCreateSchema,
  attachmentUpdateSchema,
  checklistCreateSchema,
  checklistUpdateSchema,
  commentCreateSchema,
  commentUpdateSchema,
  createSubtaskSchema,
  createTaskSchema,
  listTasksSchema,
  taskIdSchema,
  taskItemIdSchema,
  taskTagsSchema,
  timeEntryCreateSchema,
  timeEntryUpdateSchema,
  updateTaskSchema,
} from "./schemas.js";
import * as controller from "./controller.js";

export const tasksRouter = Router();

tasksRouter.get("/", validateQuery(listTasksSchema), asyncHandler(controller.list));
tasksRouter.get("/:id", validateParams(taskIdSchema), asyncHandler(controller.get));
tasksRouter.get("/:id/subtasks", validateParams(taskIdSchema), asyncHandler(controller.subtasks));
tasksRouter.get("/:id/checklist", validateParams(taskIdSchema), asyncHandler(controller.checklist));
tasksRouter.get("/:id/comments", validateParams(taskIdSchema), asyncHandler(controller.comments));
tasksRouter.get(
  "/:id/attachments",
  validateParams(taskIdSchema),
  asyncHandler(controller.attachments),
);
tasksRouter.get(
  "/:id/time-entries",
  validateParams(taskIdSchema),
  asyncHandler(controller.timeEntries),
);
tasksRouter.get("/:id/tags", validateParams(taskIdSchema), asyncHandler(controller.tags));
tasksRouter.get(
  "/:id/activities",
  validateParams(taskIdSchema),
  asyncHandler(controller.activities),
);

tasksRouter.use(requireWriteAccess);

tasksRouter.post("/", validateBody(createTaskSchema), asyncHandler(controller.create));
tasksRouter.patch(
  "/:id",
  validateParams(taskIdSchema),
  validateBody(updateTaskSchema),
  asyncHandler(controller.update),
);
tasksRouter.delete("/:id", validateParams(taskIdSchema), asyncHandler(controller.remove));
tasksRouter.post(
  "/:id/subtasks",
  validateParams(taskIdSchema),
  validateBody(createSubtaskSchema),
  asyncHandler(controller.createSubtask),
);
tasksRouter.post(
  "/:id/checklist",
  validateParams(taskIdSchema),
  validateBody(checklistCreateSchema),
  asyncHandler(controller.createChecklistItem),
);
tasksRouter.patch(
  "/:id/checklist/:itemId",
  validateParams(nestedIdParamsSchema),
  validateBody(checklistUpdateSchema),
  asyncHandler(controller.updateChecklistItem),
);
tasksRouter.delete(
  "/:id/checklist/:itemId",
  validateParams(nestedIdParamsSchema),
  asyncHandler(controller.deleteChecklistItem),
);
tasksRouter.post(
  "/:id/comments",
  validateParams(taskIdSchema),
  validateBody(commentCreateSchema),
  asyncHandler(controller.createComment),
);
tasksRouter.patch(
  "/:id/comments/:itemId",
  validateParams(nestedIdParamsSchema),
  validateBody(commentUpdateSchema),
  asyncHandler(controller.updateComment),
);
tasksRouter.delete(
  "/:id/comments/:itemId",
  validateParams(nestedIdParamsSchema),
  asyncHandler(controller.deleteComment),
);
tasksRouter.post(
  "/:id/attachments",
  validateParams(taskIdSchema),
  validateBody(attachmentCreateSchema),
  asyncHandler(controller.createAttachment),
);
tasksRouter.patch(
  "/:id/attachments/:itemId",
  validateParams(nestedIdParamsSchema),
  validateBody(attachmentUpdateSchema),
  asyncHandler(controller.updateAttachment),
);
tasksRouter.delete(
  "/:id/attachments/:itemId",
  validateParams(nestedIdParamsSchema),
  asyncHandler(controller.deleteAttachment),
);
tasksRouter.post(
  "/:id/time-entries",
  validateParams(taskIdSchema),
  validateBody(timeEntryCreateSchema),
  asyncHandler(controller.createTimeEntry),
);
tasksRouter.patch(
  "/:id/time-entries/:itemId",
  validateParams(nestedIdParamsSchema),
  validateBody(timeEntryUpdateSchema),
  asyncHandler(controller.updateTimeEntry),
);
tasksRouter.delete(
  "/:id/time-entries/:itemId",
  validateParams(nestedIdParamsSchema),
  asyncHandler(controller.deleteTimeEntry),
);
tasksRouter.put(
  "/:id/tags",
  validateParams(taskIdSchema),
  validateBody(taskTagsSchema),
  asyncHandler(controller.replaceTags),
);
