import type { RequestHandler } from "express";
import { paginationResponse } from "../../../../core/http/schemas.js";
import { routeParam, validatedQuery } from "../../../../core/http/route-params.js";
import * as service from "./service.js";

export const list: RequestHandler = async (request, response) => {
  const query = validatedQuery<{
    page: number;
    pageSize: number;
    status?: string;
    q?: string;
  }>(response);
  const result = await service.listContacts(query);
  response.json({
    data: result.data,
    pagination: paginationResponse(query.page, query.pageSize, result.total),
  });
};

export const get: RequestHandler = async (request, response) => {
  response.json(await service.getContact(routeParam(request, "id")));
};

export const create: RequestHandler = async (request, response) => {
  response.status(201).json(await service.createContact(request.body));
};

export const update: RequestHandler = async (request, response) => {
  response.json(await service.updateContact(routeParam(request, "id"), request.body));
};

export const remove: RequestHandler = async (request, response) => {
  await service.deleteContact(routeParam(request, "id"));
  response.status(204).end();
};

export const activities: RequestHandler = async (request, response) => {
  response.json(await service.listContactActivities(routeParam(request, "id")));
};

export const createActivity: RequestHandler = async (request, response) => {
  response.status(201).json(
    await service.createContactActivity(routeParam(request, "id"), request.body),
  );
};
