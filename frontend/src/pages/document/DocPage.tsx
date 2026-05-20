import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { docsApi } from "../../api/documents";
import { savedApi } from "../../api/saved";
import { useAuth } from "../../hooks/useAuth";
import { DocViewer } from "../../components/document/DocViewer";
import { SendPanel } from "../../components/document/SendPanel";
import { Badge, PrivacyBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { PageLoader } from "../../components/ui/Spinner";
import { useToast } from "../../components/ui/Toast";
import { formatDate, formatRelative } from "../../lib/utils";

export default function DocPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { toast } = useToast();
const [sendOpen, setSendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedContent, setCopiedContent] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["doc", slug],
    queryFn: () => docsApi.get(slug!),
  });

  const deleteDoc = useMutation({
    mutationFn: () => docsApi.delete(slug!),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ["doc", slug] });
      if (user?.handle) qc.invalidateQueries({ queryKey: ["profile", user.handle] });
      navigate(`/${user?.handle ?? ""}`);
      toast("Paste deleted", "success");
    },
  });

  const isOwner = user?.id === data?.doc.owner_id;

  const { data: savedData } = useQuery({
    queryKey: ["saved-check", slug],
    queryFn: () => savedApi.checkSaved(slug!),
    enabled: !!user && !isOwner,
    staleTime: 30_000,
  });
  const isSaved = savedData?.is_saved ?? false;

  const saveDoc = useMutation({
    mutationFn: () => savedApi.save(slug!),
    onSuccess: () => {
      qc.setQueryData(["saved-check", slug], { is_saved: true });
      qc.invalidateQueries({ queryKey: ["saved"] });
      toast("Paste saved", "success");
    },
    onError: (err: any) => toast(err.message ?? "Could not save", "error"),
  });

  const unsaveDoc = useMutation({
    mutationFn: () => savedApi.unsave(slug!),
    onSuccess: () => {
      qc.setQueryData(["saved-check", slug], { is_saved: false });
      qc.invalidateQueries({ queryKey: ["saved"] });
      toast("Removed from saved", "success");
    },
  });

  if (isLoading) return <PageLoader />;
  if (error) return (
    <div className="text-center py-20">
      <p className="text-2xl font-display font-bold text-ink-2 mb-2">404</p>
      <p className="text-ink-3 text-sm">{(error as any).message}</p>
      <Link to="/" style={{ color: "#00C4FF", fontSize: 14, marginTop: 12, display: "inline-block", textDecoration: "none" }}>← Back home</Link>
    </div>
  );

  const { doc } = data!;

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyContent = () => {
    navigator.clipboard.writeText(doc?.content ?? "");
    setCopiedContent(true);
    setTimeout(() => setCopiedContent(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold text-ink truncate">{doc.title}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <Link to={`/${doc.owner.handle}`} style={{ fontSize: 13, color: "var(--color-ink-2)", textDecoration: "none", fontFamily: "monospace" }}>
              @{doc.owner.handle}
            </Link>
            <span className="text-ink-3/40 text-xs">·</span>
            <span className="text-[13px] text-ink-3" title={formatDate(doc.created_at)}>
              {formatRelative(doc.created_at)}
            </span>
            {doc.updated_at !== doc.created_at && (
              <>
                <span className="text-ink-3/40 text-xs">·</span>
                <span className="text-[13px] text-ink-3">edited {formatRelative(doc.updated_at)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge>{doc.language}</Badge>
          <PrivacyBadge privacy={doc.privacy} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" onClick={copyUrl}>
          {copied ? (
            <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> Copied</>
          ) : (
            <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="3" width="7" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M4 3V2.5A1.5 1.5 0 015.5 1h3A1.5 1.5 0 0110 2.5v6A1.5 1.5 0 018.5 10H8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> Copy Link</>
          )}
        </Button>

        <Button variant="ghost" size="sm" onClick={copyContent}>
          {copiedContent ? (
            <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> Copied</>
          ) : (
            <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2h6a1 1 0 011 1v6a1 1 0 01-1 1H2a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/><path d="M4 2V1.5A.5.5 0 014.5 1h5a.5.5 0 01.5.5v7a.5.5 0 01-.5.5H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> Copy</>
          )}
        </Button>

        {user && doc.privacy !== "private" && (
          <Button variant="ghost" size="sm" onClick={() => setSendOpen(true)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M10.5 1.5L1.5 5l3.5 1.5 1.5 3.5 4-8.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
              <path d="M5 6.5l2.5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Send
          </Button>
        )}

        {user && !isOwner && doc.privacy !== "private" && (
          <Button
            variant="ghost"
            size="sm"
            loading={saveDoc.isPending || unsaveDoc.isPending}
            onClick={() => isSaved ? unsaveDoc.mutate() : saveDoc.mutate()}
          >
            {isSaved ? (
              <><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2 2h8a1 1 0 011 1v7.5L6.5 8.25 2 10.5V3a1 1 0 011-1z"/></svg> Saved</>
            ) : (
              <><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2h8a1 1 0 011 1v7.5L6.5 8.25 2 10.5V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg> Save</>
            )}
          </Button>
        )}

        {isOwner && (
          <>
            <Link to={`/docs/${slug}/edit`}>
              <Button variant="ghost" size="sm">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 1.5l2.5 2.5-6.5 6.5H1.5V8L8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Edit
              </Button>
            </Link>
<Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 3h9M4 3V2a.5.5 0 01.5-.5h3A.5.5 0 018 2v1m1.5 0L9 10a.5.5 0 01-.5.5h-5A.5.5 0 013 10L2.5 3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
              Delete
            </Button>
          </>
        )}
      </div>

      {/* Code viewer */}
      <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid var(--color-border)" }}>
        {/* Tab bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-border)" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-border)" }} />
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-border)" }} />
          </div>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "var(--color-ink-3)" }}>{doc.title}.{doc.language}</span>
        </div>

        {doc.highlighted_html ? (
          <DocViewer html={doc.highlighted_html} language={doc.language} content={doc.content} />
        ) : (
          <pre style={{ background: "var(--color-bg)", padding: "1.5rem", fontSize: 13, fontFamily: "JetBrains Mono, monospace", color: "var(--color-ink-2)", overflowX: "auto", lineHeight: 1.75, margin: 0 }}>
            {doc.content}
          </pre>
        )}
      </div>

      {/* Send modal */}
      <Modal open={sendOpen} onClose={() => setSendOpen(false)} title="Send Paste">
        <SendPanel slug={slug!} privacy={doc.privacy} />
      </Modal>

{/* Delete confirmation */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete paste?">
        <p className="text-[13px] text-ink-3 mb-5 leading-relaxed">
          <strong className="text-ink">"{doc.title}"</strong> will be permanently deleted. This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button variant="danger" size="sm" loading={deleteDoc.isPending} onClick={() => deleteDoc.mutate()}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
