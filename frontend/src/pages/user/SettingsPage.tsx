import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../../api/users";
import { useAuth } from "../../hooks/useAuth";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";

export default function SettingsPage() {
  const { user, logoutAsync } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [profile, setProfile] = useState({ display_name: "", bio: "", avatar_url: "" });
  const [pw, setPw] = useState({ current_password: "", new_password: "" });

  useEffect(() => {
    if (user) {
      setProfile({
        display_name: user.display_name ?? "",
        bio: user.bio ?? "",
        avatar_url: user.avatar_url ?? "",
      });
    }
  }, [user]);

  const updateProfile = useMutation({
    mutationFn: () => usersApi.updateMe(profile),
    onSuccess: (data) => {
      qc.setQueryData(["me"], { user: data.user });
      toast("Profile updated", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const updatePw = useMutation({
    mutationFn: () => usersApi.updateMe(pw),
    onSuccess: () => {
      setPw({ current_password: "", new_password: "" });
      toast("Password updated", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-ink)", margin: 0 }}>Settings</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, alignItems: "start" }}>
        {/* Profile */}
        <div className="pp-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)", margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>
            Profile
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 13, color: "var(--color-ink-3)" }}>
              Handle: <span style={{ color: "var(--color-ink-2)", fontFamily: "monospace" }}>@{user?.handle}</span>
            </div>
            <Input label="Display Name" value={profile.display_name} onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))} />
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-ink-2)", marginBottom: 6 }}>Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                rows={3}
                className="pp-input"
                style={{ height: "auto", padding: "10px 12px", resize: "vertical" }}
              />
            </div>
            <Input label="Avatar URL" placeholder="https://..." value={profile.avatar_url} onChange={(e) => setProfile((p) => ({ ...p, avatar_url: e.target.value }))} />
            <Button onClick={() => updateProfile.mutate()} loading={updateProfile.isPending}>
              Save Profile
            </Button>
          </div>
        </div>

        {/* Password */}
        <div className="pp-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)", margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>
            Change Password
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Current Password" type="password" value={pw.current_password} onChange={(e) => setPw((p) => ({ ...p, current_password: e.target.value }))} />
            <Input label="New Password" type="password" value={pw.new_password} onChange={(e) => setPw((p) => ({ ...p, new_password: e.target.value }))} hint="At least 8 characters" />
            <Button onClick={() => updatePw.mutate()} loading={updatePw.isPending} disabled={!pw.current_password || !pw.new_password}>
              Update Password
            </Button>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="pp-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--color-ink)", margin: "0 0 20px", paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>
          Account
        </h2>
        <Button
          variant="danger"
          onClick={async () => { await logoutAsync(); navigate("/"); }}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
