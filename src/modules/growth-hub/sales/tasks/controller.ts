import type { RequestHandler } from "express";
import { paginationResponse } from "../../../../core/http/schemas.js";
import { routeParam, validatedQuery } from "../../../../core/http/route-params.js";
import * as service from "./service.js";

export const list: RequestHandler = async (request, response) => {
  const query = validatedQuery<{
    page: number;
    pageSize: number;
    status?: string;
    assigneeId?: string;
    leadId?: string;
    contactId?: string;
  }>(response);
  const result = await service.listTasks(query);
  response.json({
    data: result.data,
    pagination: paginationResponse(query.page, query.pageSize, result.total),
  });
};

export const get: RequestHandler = async (request, response) => {
  response.json(await service.getTask(routeParam(request, "id")));
};

export const create: RequestHandler = async (request, response) => {
  response.status(201).json(await service.createTask(request.body));
};

export const update: RequestHandler = async (request, response) => {
  response.json(await service.updateTask(routeParam(request, "id"), request.body));
};

export const remove: RequestHandler = async (request, response) => {
  await service.deleteTask(routeParam(request, "id"));
  response.status(204).end();
};

export const subtasks: RequestHandler = async (request, response) => {
  response.json(await service.listSubtasks(routeParam(request, "id")));
};

export const createSubtask: RequestHandler = async (request, response) => {
  response.status(201).json(await service.createSubtask(routeParam(request, "id"), request.body));
};

export const checklist: RequestHandler = async (request, response) => {
  response.json(await service.listChecklist(routeParam(request, "id")));
};

export const createChecklistItem: RequestHandler = async (request, response) => {
  response.status(201).json(
    await service.createChecklistItem(routeParam(request, "id"), request.body),
  );
};

export const updateChecklistItem: RequestHandler = async (request, response) => {
  response.json(
    await service.updateChecklistItem(
      routeParam(request, "id"),
      routeParam(request, "itemId"),
      request.body,
    ),
  );
};

export const deleteChecklistItem: RequestHandler = async (request, response) => {
  await service.deleteChecklistItem(routeParam(request, "id"), routeParam(request, "itemId"));
  response.status(204).end();
};

export const comments: RequestHandler = async (request, response) => {
  response.json(await service.listComments(routeParam(request, "id")));
};

export const createComment: RequestHandler = async (request, response) => {
  response.status(201).json(
    await service.createComment(routeParam(request, "id"), request.body.content),
  );
};

export const updateComment: RequestHandler = async (request, response) => {
  response.json(
    await service.updateComment(
      routeParam(request, "id"),
      routeParam(request, "itemId"),
      request.body.content,
    ),
  );
};

export const deleteComment: RequestHandler = async (request, response) => {
  await service.deleteComment(routeParam(request, "id"), routeParam(request, "itemId"));
  response.status(204).end();
};

export const attachments: RequestHandler = async (request, response) => {
  response.json(await service.listAttachments(routeParam(request, "id")));
};

export const createAttachment: RequestHandler = async (request, response) => {
  response.status(201).json(
    await service.createAttachment(routeParam(request, "id"), request.body),
  );
};

export const updateAttachment: RequestHandler = async (request, response) => {
  response.json(
    await service.updateAttachment(
      routeParam(request, "id"),
      routeParam(request, "itemId"),
      request.body,
    ),
  );
};

export const deleteAttachment: RequestHandler = async (request, response) => {
  await service.deleteAttachment(routeParam(request, "id"), routeParam(request, "itemId"));
  response.status(204).end();
};

export const timeEntries: RequestHandler = async (request, response) => {
  response.json(await service.listTimeEntries(routeParam(request, "id")));
};

export const createTimeEntry: RequestHandler = async (request, response) => {
  response.status(201).json(
    await service.createTimeEntry(routeParam(request, "id"), request.body),
  );
};

export const updateTimeEntry: RequestHandler = async (request, response) => {
  response.json(
    await service.updateTimeEntry(
      routeParam(request, "id"),
      routeParam(request, "itemId"),
      request.body,
    ),
  );
};

export const deleteTimeEntry: RequestHandler = async (request, response) => {
  await service.deleteTimeEntry(routeParam(request, "id"), routeParam(request, "itemId"));
  response.status(204).end();
};

export const tags: RequestHandler = async (request, response) => {
  response.json(await service.listTags(routeParam(request, "id")));
};

export const replaceTags: RequestHandler = async (request, response) => {
  response.json(await service.replaceTags(routeParam(request, "id"), request.body.tags));
};

export const replaceRelationships: RequestHandler = async (request, response) => {
  response.json(
    await service.replaceRelationships(
      routeParam(request, "id"),
      request.body.leadIds,
      request.body.contactIds,
    ),
  );
};

export const activities: RequestHandler = async (request, response) => {
  response.json(await service.listActivities(routeParam(request, "id")));
};
