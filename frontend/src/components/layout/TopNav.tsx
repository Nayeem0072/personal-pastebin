import { Link, useNavigate } from "react-router-dom";

export function TopNav() {
  const navigate = useNavigate();

  return (
    <nav className="topnav-bar">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", maxWidth: 1000, margin: "0 auto", padding: "0 24px" }}>
        {/* Logo */}
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "linear-gradient(135deg, #00C4FF, #0080FF)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" fill="white"/>
              <path d="M10 2l3 3h-2.5A.5.5 0 0110 4.5V2z" fill="rgba(0,128,255,0.4)"/>
              <path d="M5 7h6M5 9.5h6M5 12h4" stroke="rgba(0,128,255,0.7)" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#EEEEF5", letterSpacing: "-0.3px" }}>
            Clippr
          </span>
        </Link>

        {/* Auth buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => navigate("/login")}
            className="btn-ghost btn-sm"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="btn-orange btn-sm"
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
}
