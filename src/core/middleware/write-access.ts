import type { RequestHandler } from "express";
import { env } from "../../config/env.js";
import { HttpError } from "../http/errors.js";

export const requireSalesAccess: RequestHandler = (_request, _response, next) => {
  if (env.NODE_ENV === "production") {
    next(
      new HttpError(
        503,
        "authentication_not_configured",
        "Sales data endpoints are disabled until authentication and authorization middleware are configured.",
      ),
    );
    return;
  }
  next();
};

export const requireWriteAccess: RequestHandler = (_request, _response, next) => {
  if (env.NODE_ENV === "development" && env.ALLOW_UNAUTHENTICATED_WRITES) {
    next();
    return;
  }
  next(
    new HttpError(
      403,
      "authentication_required",
      "Write operations are disabled until authentication and authorization middleware are configured.",
    ),
  );
};
