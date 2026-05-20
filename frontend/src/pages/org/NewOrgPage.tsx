import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { orgsApi } from "../../api/organizations";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";

export default function NewOrgPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({ slug: "", name: "", description: "", visibility: "public" });

  const create = useMutation({
    mutationFn: () => orgsApi.create(form),
    onSuccess: (data) => navigate(`/orgs/${data.org.slug}`),
    onError: (e: any) => toast(e.message, "error"),
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-ink)", margin: "0 0 32px" }}>Create Organization</h1>

      <div className="pp-card" style={{ padding: 24 }}>
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input
            label="Organization Name"
            placeholder="My Team"
            required
            {...field("name")}
          />
          <Input
            label="Slug"
            placeholder="my-team"
            hint="URL-safe identifier. Cannot be changed."
            required
            {...field("slug")}
          />
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--color-ink-2)", marginBottom: 6 }}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="What is this org for?"
              className="pp-input"
              style={{ height: "auto", padding: "10px 12px", resize: "vertical" }}
            />
          </div>
          <Select
            label="Visibility"
            options={[
              { value: "public", label: "Public — Anyone can find and view" },
              { value: "private", label: "Private — Hidden to non-members" },
            ]}
            {...field("visibility")}
          />
          <div style={{ marginTop: 4 }}>
            <Button type="submit" loading={create.isPending} disabled={!form.slug || !form.name}>
              Create Organization
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
