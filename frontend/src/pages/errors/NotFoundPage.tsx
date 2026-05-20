import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <p style={{ fontSize: 64, fontWeight: 800, color: "var(--color-border)", margin: "0 0 8px", lineHeight: 1 }}>404</p>
      <p style={{ fontSize: 18, fontWeight: 600, color: "var(--color-ink)", margin: "0 0 8px" }}>Page not found</p>
      <p style={{ fontSize: 14, color: "var(--color-ink-3)", margin: "0 0 28px" }}>The page you're looking for doesn't exist.</p>
      <Link to="/"><Button>Go Home</Button></Link>
    </div>
  );
}
