import "./db/migrate"; // run migrations on startup
import { Hono } from "hono";
import { cors } from "./middleware/cors";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import docRoutes from "./routes/documents";
import groupRoutes from "./routes/groups";
import searchRoutes from "./routes/search";
import sendsRoutes from "./routes/sends";
import savedRoutes from "./routes/saved";
import trendingRoutes from "./routes/trending";
import { ogRoutes } from "./routes/og";

const app = new Hono();

app.use("*", cors);
app.onError(errorHandler);

app.route("/api/auth", authRoutes);
app.route("/api/users", userRoutes);
app.route("/api/documents", docRoutes);
app.route("/api/groups", groupRoutes);
app.route("/api/search", searchRoutes);
app.route("/api/sends", sendsRoutes);
app.route("/api/saved", savedRoutes);
app.route("/api/trending", trendingRoutes);
app.route("/api/og", ogRoutes);

app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }));

const port = Number(process.env.PORT ?? 3001);
console.log(`[server] Listening on http://localhost:${port}`);

export default { port, fetch: app.fetch };
