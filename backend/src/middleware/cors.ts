import { cors as honoCors } from "hono/cors";

const isProduction = process.env.NODE_ENV === "production";
const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";

export const cors = honoCors({
  origin: frontendUrl,
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
  credentials: true,
  maxAge: 86400,
});
