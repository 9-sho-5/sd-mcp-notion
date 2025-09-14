import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("[unhandled]", err);
  res.status(500).json({ error: "internal_error" });
}
