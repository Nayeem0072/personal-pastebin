import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";
import { useState, useRef, useEffect } from "react";

export function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMenuOpen(false);
  };

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to || location.pathname.startsWith(to + "/");
    return (
      <Link
        to={to}
        className={`text-[13px] transition-colors duration-150 ${
          active ? "text-ink" : "text-ink-3 hover:text-ink-2"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-5 h-12 flex items-center justify-between gap-4">
        {/* Left: Logo + nav */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded-md bg-lime flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2h3v3H2V2zM7 2h3v3H7V2zM2 7h3v3H2V7zM7 9h1M9 7v1M9 10h1" stroke="#08080B" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="text-[14px] font-semibold font-display text-ink tracking-tight">Clippr</span>
          </Link>

          <div className="hidden sm:flex items-center gap-5">
            {navLink("/search", "Explore")}
            {isLoggedIn && navLink("/orgs/new", "Orgs")}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Button size="sm" onClick={() => navigate("/new")} className="hidden sm:flex">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                New Paste
              </Button>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors duration-150 ${
                    menuOpen ? "bg-elevated" : "hover:bg-elevated"
                  }`}
                >
                  <div className="w-6 h-6 rounded-md bg-elevated border border-line flex items-center justify-center text-[11px] font-bold text-lime font-mono">
                    {(user?.handle ?? "?")[0].toUpperCase()}
                  </div>
                  <span className="text-[13px] text-ink-2 hidden sm:block">{user?.handle}</span>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-ink-3 hidden sm:block">
                    <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl border border-line bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1 overflow-hidden animate-fade-up">
                    <Link
                      to={`/${user?.handle}`}
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink-2 hover:text-ink hover:bg-elevated transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 12c0-3.038 2.462-5.5 5.5-5.5S12 8.962 12 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-ink-2 hover:text-ink hover:bg-elevated transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 8a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" stroke="currentColor" strokeWidth="1.2"/><path d="M10.5 6.5l.9-.5-.9-1.6-.9.5a3.5 3.5 0 00-.8-.5L8.5 3.5h-2l-.3 1a3.5 3.5 0 00-.8.5l-.9-.5L3.6 6.1l.9.5a3.5 3.5 0 000 .9l-.9.5.9 1.6.9-.5c.2.2.5.4.8.5l.3 1h2l.3-1c.3-.1.5-.3.8-.5l.9.5.9-1.6-.9-.5a3.5 3.5 0 000-.9z" stroke="currentColor" strokeWidth="1.2"/></svg>
                      Settings
                    </Link>
                    <div className="border-t border-line my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-400/80 hover:text-red-400 hover:bg-elevated transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 4.5l2 2-2 2M11 6.5H5M7 2.5H2.5a.5.5 0 00-.5.5v7a.5.5 0 00.5.5H7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
