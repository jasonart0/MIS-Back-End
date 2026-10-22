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
  const result = await service.listLeads(query);
  response.json({
    data: result.data,
    pagination: paginationResponse(query.page, query.pageSize, result.total),
  });
};
export const get: RequestHandler = async (request, response) => {
  response.json(await service.getLead(routeParam(request, "id")));
};

export const create: RequestHandler = async (request, response) => {
  response.status(201).json(await service.createLead(request.body));
};

export const update: RequestHandler = async (request, response) => {
  response.json(await service.updateLead(routeParam(request, "id"), request.body));
};

export const remove: RequestHandler = async (request, response) => {
  await service.deleteLead(routeParam(request, "id"));
  response.status(204).end();
};

export const activities: RequestHandler = async (request, response) => {
  response.json(await service.listLeadActivities(routeParam(request, "id")));
};

export const createActivity: RequestHandler = async (request, response) => {
  response.status(201).json(
    await service.createLeadActivity(routeParam(request, "id"), request.body),
  );
};
