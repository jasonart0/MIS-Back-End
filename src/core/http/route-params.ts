import type { Request } from "express";
import { HttpError } from "./errors.js";

export const routeParam = (request: Request, name: string): string => {
  const value = request.params[name];
  if (typeof value !== "string") {
    throw new HttpError(400, "invalid_route_parameter", "Route parameter must be a single value.");
  }
  return value;
};

export const validatedQuery = <T>(response: { locals: Record<string, unknown> }): T =>
  response.locals.validatedQuery as T;
