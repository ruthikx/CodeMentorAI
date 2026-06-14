import type { NextFunction, Request, Response, RequestHandler } from "express";

export function asyncRoute<TRequest extends Request = Request, TResponse extends Response = Response>(
  handler: (request: TRequest, response: TResponse, next: NextFunction) => Promise<void>
): RequestHandler {
  return (request, response, next) => {
    void handler(request as TRequest, response as TResponse, next).catch(next);
  };
}
