import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCallback } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

function NavLink({ to, label, icon, exact }: NavItem) {
  const { pathname } = useLocation();
  const active = exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  return (
    <Link to={to} className={`nav-link ${active ? "active" : ""}`}>
      {icon}
      {label}
    </Link>
  );
}

const DocsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="1.5" width="10" height="13" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M5 5.5h5M5 8h5M5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const OrgsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    <path d="M11 3.5c1.38 0 2.5 1.12 2.5 2.5S12.38 8.5 11 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    <path d="M13 11c.9.8 1.5 1.9 1.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);
const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.41 1.41M11.19 11.19l1.41 1.41M3.4 12.6l1.41-1.41M11.19 4.81l1.41-1.41" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

export function Sidebar() {
  const { user, logoutAsync } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="app-sidebar" style={{ flexDirection: "column", padding: "20px 12px" }}>
      {/* Logo */}
      <Link to="/new" style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 10px", marginBottom: 28, textDecoration: "none",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: "linear-gradient(135deg, #00C4FF, #0080FF)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" fill="white"/>
            <path d="M10 2l3 3h-2.5A.5.5 0 0110 4.5V2z" fill="rgba(0,128,255,0.4)"/>
            <path d="M5 7h6M5 9.5h6M5 12h4" stroke="rgba(0,128,255,0.7)" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#EEEEF5", letterSpacing: "-0.3px" }}>
          Clippr
        </span>
      </Link>

      {/* Nav section */}
      <p style={{ fontSize: 11, fontWeight: 600, color: "#555568", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, paddingLeft: 14 }}>
        Menu
      </p>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 24 }}>
        <NavLink to="/new" label="New Paste" icon={<PlusIcon />} exact />
        <NavLink to="/search" label="Explore" icon={<SearchIcon />} />
        <NavLink to="/orgs" label="Organizations" icon={<OrgsIcon />} />
      </nav>

      <p style={{ fontSize: 11, fontWeight: 600, color: "#555568", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6, paddingLeft: 14 }}>
        Account
      </p>
      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <NavLink to={`/${user?.handle}`} label="My Pastes" icon={<DocsIcon />} />
        <NavLink to="/settings" label="Settings" icon={<SettingsIcon />} />
      </nav>

      {/* Bottom: user card */}
      <div style={{ marginTop: "auto" }}>
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid #38383F",
          borderRadius: 12,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, #00C4FF, #0080FF)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700, color: "#0A0A14", flexShrink: 0,
          }}>
            {(user?.handle ?? "?")[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#EEEEF5", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.display_name ?? user?.handle}
            </p>
            <p style={{ fontSize: 11, color: "#555568", margin: 0 }}>@{user?.handle}</p>
          </div>
          <button
            onClick={async () => { await logoutAsync(); navigate("/"); }}
            title="Sign out"
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#555568", padding: 4, borderRadius: 6, transition: "color 150ms",
              display: "flex", alignItems: "center",
            }}
            onMouseOver={e => (e.currentTarget.style.color = "#f87171")}
            onMouseOut={e => (e.currentTarget.style.color = "#555568")}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9.5 4.5l2.5 2.5-2.5 2.5M12 7H5.5M7 2H2.5A.5.5 0 002 2.5v9a.5.5 0 00.5.5H7"
                stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { pathname } = useLocation();
  const { user, logoutAsync } = useAuth();
  const navigate = useNavigate();

  const active = useCallback((path: string, exact = false) =>
    exact ? pathname === path : pathname === path || pathname.startsWith(path + "/")
  , [pathname]);

  const handleLogout = async () => {
    await logoutAsync();
    navigate("/");
  };

  return (
    <nav className="mobile-nav">
      <Link to="/new" className={`mobile-nav-item ${active("/new", true) ? "active" : ""}`}>
        <PlusIcon />
        New
      </Link>
      <Link to="/search" className={`mobile-nav-item ${active("/search") ? "active" : ""}`}>
        <SearchIcon />
        Explore
      </Link>
      <Link to="/orgs" className={`mobile-nav-item ${active("/orgs") ? "active" : ""}`}>
        <OrgsIcon />
        Orgs
      </Link>
      <Link to={`/${user?.handle}`} className={`mobile-nav-item ${active(`/${user?.handle ?? "__"}`) ? "active" : ""}`}>
        <DocsIcon />
        Pastes
      </Link>
      <button className="mobile-nav-item" onClick={handleLogout}>
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
          <path d="M9.5 4.5l2.5 2.5-2.5 2.5M12 7H5.5M7 2H2.5A.5.5 0 002 2.5v9a.5.5 0 00.5.5H7"
            stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Logout
      </button>
    </nav>
  );
}
