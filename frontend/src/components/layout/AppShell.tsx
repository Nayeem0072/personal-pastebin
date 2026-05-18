import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
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
    </ToastProvider>
  );
}
