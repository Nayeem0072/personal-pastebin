import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { docsApi } from "../../api/documents";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useToast } from "../ui/Toast";

interface SharePanelProps {
  slug: string;
}

export function SharePanel({ slug }: SharePanelProps) {
  const [query, setQuery] = useState("");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data } = useQuery({
    queryKey: ["doc-shares", slug],
    queryFn: () => docsApi.getShares(slug),
  });

  const addShare = useMutation({
    mutationFn: (q: string) => docsApi.addShare(slug, q),
    onSuccess: () => {
      setQuery("");
      qc.invalidateQueries({ queryKey: ["doc-shares", slug] });
      toast("Shared successfully", "success");
    },
    onError: (e: any) => toast(e.message, "error"),
  });

  const removeShare = useMutation({
    mutationFn: (userId: number) => docsApi.removeShare(slug, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc-shares", slug] }),
    onError: (e: any) => toast(e.message, "error"),
  });

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-300">Share with users</h3>

      <div className="flex gap-2">
        <Input
          placeholder="Handle or email address"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query && addShare.mutate(query)}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={() => addShare.mutate(query)}
          loading={addShare.isPending}
          disabled={!query}
        >
          Share
        </Button>
      </div>

      {data?.shares && data.shares.length > 0 && (
        <ul className="space-y-2">
          {data.shares.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white">
                  {(s.display_name ?? s.handle)[0].toUpperCase()}
                </div>
                <span className="text-sm text-gray-300">@{s.handle}</span>
                {s.display_name && (
                  <span className="text-xs text-gray-500">{s.display_name}</span>
                )}
              </div>
              <button
                onClick={() => removeShare.mutate(s.id)}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {data?.shares?.length === 0 && (
        <p className="text-sm text-gray-600">Not shared with anyone yet.</p>
      )}
    </div>
  );
}
