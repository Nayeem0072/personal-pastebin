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
import NewGroupPage from "./pages/group/NewGroupPage";
import GroupPage from "./pages/group/GroupPage";
import GroupMembersPage from "./pages/group/GroupMembersPage";
import GroupInvitesPage from "./pages/group/GroupInvitesPage";
import GroupRequestsPage from "./pages/group/GroupRequestsPage";
import GroupSettingsPage from "./pages/group/GroupSettingsPage";
import JoinGroupPage from "./pages/group/JoinGroupPage";
import GroupListPage from "./pages/group/GroupListPage";
import SharedPage from "./pages/shared/SharedPage";
import SavedPage from "./pages/saved/SavedPage";
import TrendingPage from "./pages/trending/TrendingPage";
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
        <Route path="/trending" element={<TrendingPage />} />
        <Route path="/docs/:slug" element={<DocPage />} />
        <Route path="/join/:code" element={<JoinGroupPage />} />

        {/* Auth required */}
        <Route path="/new" element={<ProtectedRoute><NewDocPage /></ProtectedRoute>} />
        <Route path="/paste" element={<ProtectedRoute><NewDocPage /></ProtectedRoute>} />
        <Route path="/docs/:slug/edit" element={<ProtectedRoute><EditDocPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/groups" element={<ProtectedRoute><GroupListPage /></ProtectedRoute>} />
        <Route path="/groups/new" element={<ProtectedRoute><NewGroupPage /></ProtectedRoute>} />
        <Route path="/groups/:slug/members" element={<ProtectedRoute><GroupMembersPage /></ProtectedRoute>} />
        <Route path="/groups/:slug/invites" element={<ProtectedRoute><GroupInvitesPage /></ProtectedRoute>} />
        <Route path="/groups/:slug/requests" element={<ProtectedRoute><GroupRequestsPage /></ProtectedRoute>} />
        <Route path="/groups/:slug/settings" element={<ProtectedRoute><GroupSettingsPage /></ProtectedRoute>} />
        <Route path="/groups/:slug" element={<GroupPage />} />

        <Route path="/shared" element={<ProtectedRoute><SharedPage /></ProtectedRoute>} />
        <Route path="/saved"  element={<ProtectedRoute><SavedPage /></ProtectedRoute>} />

        {/* Handle routes last — must be after /groups, /docs, etc. */}
        <Route path="/:handle" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
