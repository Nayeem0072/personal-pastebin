import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { docsApi } from "../../api/documents";
import { groupsApi } from "../../api/groups";
import { useAuth } from "../../hooks/useAuth";
import { DocEditor } from "../../components/document/DocEditor";
import { Button } from "../../components/ui/Button";
import { PageLoader } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";

export default function EditDocPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["doc", slug],
    queryFn: () => docsApi.get(slug!),
  });

  const { data: groupsData } = useQuery({
    queryKey: ["my-groups"],
    queryFn: () => groupsApi.list(),
  });

  const [form, setForm] = useState({
    title: "",
    content: "",
    language: "plaintext",
    privacy: "public",
    groupId: null as number | null,
  });

  useEffect(() => {
    if (data?.doc) {
      const d = data.doc;
      setForm({
        title: d.title,
        content: d.content,
        language: d.language,
        privacy: d.privacy,
        groupId: d.group_id,
      });
    }
  }, [data]);

  const update = useMutation({
    mutationFn: () =>
      docsApi.update(slug!, {
        title: form.title,
        content: form.content,
        language: form.language,
        privacy: form.privacy as any,
        group_id: form.privacy === "group" ? form.groupId ?? undefined : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc", slug] });
      if (user?.handle) qc.invalidateQueries({ queryKey: ["profile", user.handle] });
      navigate(`/docs/${slug}`);
      toast("Saved", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  if (isLoading) return <PageLoader />;
  if (!data || data.doc.owner_id !== user?.id) {
    navigate(`/docs/${slug}`);
    return null;
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#EEEEF5", margin: 0 }}>Edit Paste</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" onClick={() => navigate(`/docs/${slug}`)}>Cancel</Button>
          <Button onClick={() => update.mutate()} loading={update.isPending}>Save Changes</Button>
        </div>
      </div>

      <div className="pp-card" style={{ padding: 20 }}>
        <DocEditor
          {...form}
          groupId={form.groupId}
          userGroups={groupsData?.groups ?? []}
          onChange={(f, v) => setForm((prev) => ({ ...prev, [f]: v }))}
        />
      </div>
    </div>
  );
}
