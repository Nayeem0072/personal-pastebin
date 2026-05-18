import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { docsApi } from "../../api/documents";
import { orgsApi } from "../../api/organizations";
import { DocEditor } from "../../components/document/DocEditor";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";

export default function NewDocPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: "",
    content: "",
    language: "plaintext",
    description: "",
    privacy: "public",
    orgId: null as number | null,
  });

  const { data: orgsData } = useQuery({
    queryKey: ["my-orgs"],
    queryFn: () => orgsApi.list(),
  });

  const create = useMutation({
    mutationFn: () =>
      docsApi.create({
        title: form.title || undefined,
        content: form.content,
        language: form.language,
        description: form.description || undefined,
        privacy: form.privacy,
        org_id: form.privacy === "org" ? form.orgId ?? undefined : undefined,
      }),
    onSuccess: (data) => {
      if (user?.handle) qc.invalidateQueries({ queryKey: ["profile", user.handle] });
      navigate(`/docs/${data.slug}`);
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#EEEEF5", margin: "0 0 4px" }}>New Paste</h1>
          <p style={{ fontSize: 13, color: "#555568", margin: 0 }}>Share code, configs, or notes</p>
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
          orgId={form.orgId}
          userOrgs={orgsData?.orgs ?? []}
          onChange={(f, v) => setForm((prev) => ({ ...prev, [f]: v }))}
        />
      </div>
    </div>
  );
}
