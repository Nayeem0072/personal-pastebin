import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
  </svg>
);

export function TopNav() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

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
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-ink)", letterSpacing: "-0.3px" }}>
            Clippr
          </span>
        </Link>

        {/* Auth buttons + theme toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="btn-ghost btn-sm"
            style={{ padding: "0 10px" }}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
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
