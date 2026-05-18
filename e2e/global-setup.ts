async function globalSetup() {
  let backendUp = false;
  let frontendUp = false;

  try {
    const res = await fetch("http://localhost:3001/health");
    backendUp = res.ok;
  } catch {}

  try {
    const res = await fetch("http://localhost:5173");
    frontendUp = res.ok || res.status < 500;
  } catch {}

  if (!backendUp || !frontendUp) {
    console.warn("\n[e2e] WARNING: One or more servers are not running.");
    console.warn(`[e2e] Backend  http://localhost:3001/health → ${backendUp ? "OK" : "DOWN"}`);
    console.warn(`[e2e] Frontend http://localhost:5173         → ${frontendUp ? "OK" : "DOWN"}`);
    console.warn("[e2e] Tests will be skipped. Run: bun run dev:backend && bun run dev:frontend\n");
    process.env.SERVERS_DOWN = "true";
  }
}

export default globalSetup;
