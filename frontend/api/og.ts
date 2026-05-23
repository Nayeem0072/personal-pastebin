export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const slug = url.searchParams.get("slug");
  const code = url.searchParams.get("code");

  const apiUrl = (process.env.VITE_API_URL ?? "").replace(/\/$/, "");
  if (!apiUrl) return new Response("missing API URL", { status: 500 });

  let metaPath: string;
  if (type === "doc" && slug) {
    metaPath = `/api/og/meta/${slug}`;
  } else if (type === "invite" && code) {
    metaPath = `/api/og/meta/invite/${code}`;
  } else {
    return new Response("bad request", { status: 400 });
  }

  try {
    const resp = await fetch(`${apiUrl}${metaPath}`);
    const html = await resp.text();
    return new Response(html, {
      status: resp.status,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return new Response("upstream error", { status: 502 });
  }
}
