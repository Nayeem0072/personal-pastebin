import type { ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(err);
  const status = (err as any).status ?? 500;
  return c.json({ error: err.message ?? "Internal server error" }, status);
};
