import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: "center", padding: "80px 24px" }}>
      <p style={{ fontSize: 64, fontWeight: 800, color: "#38383F", margin: "0 0 8px", lineHeight: 1 }}>404</p>
      <p style={{ fontSize: 18, fontWeight: 600, color: "#EEEEF5", margin: "0 0 8px" }}>Page not found</p>
      <p style={{ fontSize: 14, color: "#555568", margin: "0 0 28px" }}>The page you're looking for doesn't exist.</p>
      <Link to="/"><Button>Go Home</Button></Link>
    </div>
  );
}
