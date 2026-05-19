import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi } from "../../api/groups";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { PageLoader } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";

export default function GroupSettingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["group", slug],
    queryFn: () => groupsApi.get(slug!),
  });

  const [form, setForm] = useState({ name: "", description: "", visibility: "public" });

  useEffect(() => {
    if (data?.group) {
      setForm({
        name: data.group.name,
        description: data.group.description ?? "",
        visibility: data.group.visibility,
      });
    }
  }, [data]);

  const update = useMutation({
    mutationFn: () => groupsApi.update(slug!, form as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["group", slug] });
      toast("Settings saved", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const deleteGroup = useMutation({
    mutationFn: () => groupsApi.delete(slug!),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["group", slug] });
      navigate("/");
      toast("Group deleted", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  if (isLoading) return <PageLoader />;
  if (data?.role !== "owner") {
    navigate(`/groups/${slug}`);
    return null;
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#EEEEF5", margin: 0 }}>Group Settings</h1>

      <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "#8A8AA2", marginBottom: 0, paddingBottom: 12, borderBottom: "1px solid #38383F" }}>
          General
        </h2>
        <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#8A8AA2", marginBottom: 6 }}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            className="pp-input"
            style={{ height: "auto", padding: "10px 12px", resize: "vertical" }}
          />
        </div>
        <Select
          label="Visibility"
          value={form.visibility}
          options={[
            { value: "public", label: "Public" },
            { value: "private", label: "Private" },
          ]}
          onChange={(e) => setForm((f) => ({ ...f, visibility: e.target.value }))}
        />
        <div>
          <Button onClick={() => update.mutate()} loading={update.isPending}>Save Changes</Button>
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, color: "#f87171", paddingBottom: 12, borderBottom: "1px solid #38383F", margin: 0 }}>
          Danger Zone
        </h2>
        <p style={{ fontSize: 13, color: "#555568", margin: 0 }}>
          Deleting a group is permanent and cannot be undone. All group data will be removed.
        </p>
        <div>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>Delete Group</Button>
        </div>
      </section>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Group">
        <p style={{ fontSize: 13, color: "#8A8AA2", marginBottom: 20, lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: "#EEEEF5" }}>{data?.group.name}</strong>? This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteGroup.isPending} onClick={() => deleteGroup.mutate()}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
