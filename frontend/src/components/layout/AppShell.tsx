import { Outlet, useLocation } from "react-router-dom";
import { Sidebar, MobileNav } from "./Sidebar";
import { TopNav } from "./TopNav";
import { ToastProvider } from "../ui/Toast";
import { useAuth } from "../../hooks/useAuth";

function AnimatedOutlet() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      <Outlet />
    </div>
  );
}

export function AppShell() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <ToastProvider>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg className="animate-spin" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      </ToastProvider>
    );
  }

  if (!isLoggedIn) {
    return (
      <ToastProvider>
        <div className="topnav-layout">
          <TopNav />
          <div className="topnav-content">
            <AnimatedOutlet />
          </div>
        </div>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="app-layout">
        <Sidebar />
        <div className="app-content">
          <main className="app-main">
            <AnimatedOutlet />
          </main>
        </div>
      </div>
      <MobileNav />
    </ToastProvider>
  );
}
