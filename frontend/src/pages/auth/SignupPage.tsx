import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../api/auth";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "", handle: "", display_name: "" });
  const [handleStatus, setHandleStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!form.handle || !/^[a-z0-9-]{3,32}$/.test(form.handle)) {
      setHandleStatus("idle");
      return;
    }
    setHandleStatus("checking");
    const t = setTimeout(async () => {
      try {
        const res = await authApi.checkHandle(form.handle);
        setHandleStatus(res.available ? "available" : "taken");
      } catch { setHandleStatus("idle"); }
    }, 400);
    return () => clearTimeout(t);
  }, [form.handle]);

  const signup = useMutation({
    mutationFn: () => authApi.signup(form),
    onSuccess: (data) => { qc.setQueryData(["me"], data); navigate("/"); },
    onError: (e: any) => setError(e.message),
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleError =
    handleStatus === "taken" ? "Handle is already taken"
    : form.handle && !/^[a-z0-9-]{3,32}$/.test(form.handle) ? "Invalid format"
    : undefined;

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
              <rect x="2" y="2" width="5.5" height="5.5" rx="1.5" fill="white"/>
              <rect x="8.5" y="2" width="5.5" height="5.5" rx="1.5" fill="rgba(255,255,255,0.6)"/>
              <rect x="2" y="8.5" width="5.5" height="5.5" rx="1.5" fill="rgba(255,255,255,0.6)"/>
              <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" fill="rgba(255,255,255,0.35)"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#EEEEF5", margin: "0 0 6px" }}>Create account</h1>
          <p style={{ fontSize: 14, color: "#555568", margin: 0 }}>Join Clippr to start sharing</p>
        </div>

        <div className="pp-card" style={{ padding: 24 }}>
          <form
            onSubmit={(e) => { e.preventDefault(); setError(""); if (handleStatus === "taken") return setError("That handle is already taken."); signup.mutate(); }}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <Input label="Display name" placeholder="Your name" {...field("display_name")} />

            <div>
              <Input label="Handle" placeholder="your-handle" hint={handleStatus === "idle" ? "3–32 chars: lowercase, numbers, hyphens" : undefined} error={handleError} {...field("handle")} />
              {handleStatus === "available" && !handleError && (
                <p style={{ fontSize: 12, color: "#4ADE80", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.1"/><path d="M3.5 5.5L5 7L7.5 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Available
                </p>
              )}
              {handleStatus === "checking" && <p style={{ fontSize: 12, color: "#555568", marginTop: 4 }}>Checking...</p>}
            </div>

            <Input label="Email" type="email" autoComplete="email" required placeholder="you@example.com" {...field("email")} />
            <Input label="Password" type="password" autoComplete="new-password" required placeholder="••••••••" hint="At least 8 characters" {...field("password")} />

            {error && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 13 }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.2"/><path d="M6.5 4v3M6.5 8.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                {error}
              </div>
            )}

            <Button type="submit" size="lg" loading={signup.isPending} disabled={handleStatus === "taken" || handleStatus === "checking"} style={{ marginTop: 4, width: "100%" }}>
              Create Account
            </Button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 13, color: "#555568", marginTop: 20 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#00C4FF", textDecoration: "none", fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
