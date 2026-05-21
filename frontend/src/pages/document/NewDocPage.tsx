import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { docsApi } from "../../api/documents";
import { groupsApi } from "../../api/groups";
import { DocEditor } from "../../components/document/DocEditor";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";
import { getDefaultLanguage, getDefaultPrivacy, getDefaultGroupId, setDefaultLanguage, setDefaultPrivacy } from "../../lib/pasteDefaults";
import { formatRelative } from "../../lib/utils";

export default function NewDocPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: "",
    content: "",
    language: getDefaultLanguage(),
    privacy: getDefaultPrivacy(),
    groupId: getDefaultGroupId(),
  });

  const { data: groupsData } = useQuery({
    queryKey: ["my-groups"],
    queryFn: () => groupsApi.list(),
  });

  const { data: recentData } = useQuery({
    queryKey: ["my-docs-recent"],
    queryFn: () => docsApi.list(1, 5),
    enabled: !!user,
    staleTime: 30_000,
  });

  const create = useMutation({
    mutationFn: () =>
      docsApi.create({
        title: form.title || undefined,
        content: form.content,
        language: form.language,
        privacy: form.privacy,
        group_id: form.privacy === "group" ? form.groupId ?? undefined : undefined,
      }),
    onSuccess: (data) => {
      if (user?.handle) qc.invalidateQueries({ queryKey: ["profile", user.handle] });
      navigate(`/docs/${data.slug}`);
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (form.content.trim() && !create.isPending) create.mutate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [form.content, create.isPending]);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-ink)", margin: "0 0 4px" }}>New Paste</h1>
          <p style={{ fontSize: 13, color: "var(--color-ink-3)", margin: 0 }}>Share code, configs, or notes</p>
        </div>
        <Button
          onClick={() => create.mutate()}
          loading={create.isPending}
          disabled={!form.content.trim()}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2 6.5L5.5 10L11 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Save Paste
        </Button>
      </div>

      <div className="pp-card" style={{ padding: 20 }}>
        <DocEditor
          {...form}
          groupId={form.groupId}
          userGroups={groupsData?.groups ?? []}
          showSetDefault
          onSetDefault={() => {
            setDefaultLanguage(form.language);
            setDefaultPrivacy(form.privacy);
            toast("Defaults saved", "success");
          }}
          onChange={(f, v) => setForm((prev) => ({ ...prev, [f]: v }))}
        />
      </div>

      {recentData?.docs && recentData.docs.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 12, color: "var(--color-ink-3)", marginBottom: 8, fontWeight: 500, margin: "0 0 8px 2px" }}>Recent</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {recentData.docs.map(doc => (
              <Link
                key={doc.slug}
                to={`/docs/${doc.slug}`}
                style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
                  borderRadius: 8, color: "var(--color-ink-2)", textDecoration: "none",
                  fontSize: 13, transition: "background 150ms",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--color-hover-overlay)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {doc.title || "Untitled"}
                </span>
                <span style={{ fontSize: 11, color: "var(--color-ink-3)", fontFamily: "monospace", flexShrink: 0 }}>
                  {doc.language}
                </span>
                <span style={{ fontSize: 11, color: "var(--color-ink-3)", flexShrink: 0 }}>
                  {formatRelative(doc.created_at)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
