import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import NewDocPage from "./pages/document/NewDocPage";
import DocPage from "./pages/document/DocPage";
import EditDocPage from "./pages/document/EditDocPage";
import ProfilePage from "./pages/user/ProfilePage";
import SettingsPage from "./pages/user/SettingsPage";
import SearchPage from "./pages/search/SearchPage";
import NewOrgPage from "./pages/org/NewOrgPage";
import OrgPage from "./pages/org/OrgPage";
import OrgMembersPage from "./pages/org/OrgMembersPage";
import OrgInvitesPage from "./pages/org/OrgInvitesPage";
import OrgRequestsPage from "./pages/org/OrgRequestsPage";
import OrgSettingsPage from "./pages/org/OrgSettingsPage";
import JoinOrgPage from "./pages/org/JoinOrgPage";
import OrgListPage from "./pages/org/OrgListPage";
import SharedPage from "./pages/shared/SharedPage";
import NotFoundPage from "./pages/errors/NotFoundPage";

function HomeRedirect() {
  const { isLoggedIn, isLoading } = useAuth();
  if (isLoading) return null;
  return isLoggedIn ? <Navigate to="/new" replace /> : <HomePage />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        {/* Public */}
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/docs/:slug" element={<DocPage />} />
        <Route path="/join/:code" element={<JoinOrgPage />} />

        {/* Auth required */}
        <Route path="/new" element={<ProtectedRoute><NewDocPage /></ProtectedRoute>} />
        <Route path="/paste" element={<ProtectedRoute><NewDocPage /></ProtectedRoute>} />
        <Route path="/docs/:slug/edit" element={<ProtectedRoute><EditDocPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/orgs" element={<ProtectedRoute><OrgListPage /></ProtectedRoute>} />
        <Route path="/orgs/new" element={<ProtectedRoute><NewOrgPage /></ProtectedRoute>} />
        <Route path="/orgs/:slug/members" element={<ProtectedRoute><OrgMembersPage /></ProtectedRoute>} />
        <Route path="/orgs/:slug/invites" element={<ProtectedRoute><OrgInvitesPage /></ProtectedRoute>} />
        <Route path="/orgs/:slug/requests" element={<ProtectedRoute><OrgRequestsPage /></ProtectedRoute>} />
        <Route path="/orgs/:slug/settings" element={<ProtectedRoute><OrgSettingsPage /></ProtectedRoute>} />
        <Route path="/orgs/:slug" element={<OrgPage />} />

        <Route path="/shared" element={<ProtectedRoute><SharedPage /></ProtectedRoute>} />

        {/* Handle routes last — must be after /orgs, /docs, etc. */}
        <Route path="/:handle" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
