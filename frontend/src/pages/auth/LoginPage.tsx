import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../api/auth";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const qc = useQueryClient();

  const login = useMutation({
    mutationFn: () => authApi.login(email, password),
    onSuccess: (data) => {
      qc.setQueryData(["me"], data);
      navigate(params.get("next") ?? "/new");
    },
    onError: (e: any) => setError(e.message),
  });

  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, #00C4FF, #0080FF)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              <path d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z" fill="white"/>
              <path d="M10 2l3 3h-2.5A.5.5 0 0110 4.5V2z" fill="rgba(0,128,255,0.4)"/>
              <path d="M5 7h6M5 9.5h6M5 12h4" stroke="rgba(0,128,255,0.7)" strokeWidth="1.1" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-ink)", margin: "0 0 6px" }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: "var(--color-ink-3)", margin: 0 }}>Sign in to your Clippr account</p>
        </div>

        <div className="pp-card" style={{ padding: 24 }}>
          <form
            onSubmit={(e) => { e.preventDefault(); setError(""); login.mutate(); }}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" placeholder="••••••••" required />

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 13 }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 4v3M6.5 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            <Button type="submit" loading={login.isPending} size="lg" style={{ marginTop: 4, width: "100%" }}>
              Sign In
            </Button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "var(--color-ink-3)", marginTop: 20 }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "#00C4FF", textDecoration: "none", fontWeight: 500 }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}
