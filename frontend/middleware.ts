import { next } from "@vercel/edge";

export const config = {
  matcher: ["/docs/:slug+", "/join/:code+"],
};

const BOT_RE =
  /bot|crawler|spider|slackbot|discordbot|facebookexternalhit|twitterbot|telegrambot|whatsapp|linkedinbot|applebot|googlebot|bingbot/i;

export default async function middleware(req: Request): Promise<Response> {
  const ua = req.headers.get("user-agent") ?? "";
  if (!BOT_RE.test(ua)) return next();

  const url = new URL(req.url);
  const apiUrl = process.env.VITE_API_URL ?? process.env.BACKEND_URL ?? "";

  // Diagnostic response — no external fetch so we can confirm middleware runs
  // and see what env vars are available.
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OG debug</title>
  <meta property="og:title" content="mw=ok apiUrl=${apiUrl ? "SET" : "EMPTY"} path=${url.pathname}">
  <meta property="og:description" content="${ua.slice(0, 80)}">
</head>
</html>`;

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
