import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchApi } from "../api/search";

export function useSearch(params: { q: string; org?: string; lang?: string; page?: number }) {
  const [debouncedQ, setDebouncedQ] = useState(params.q);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(params.q), 300);
    return () => clearTimeout(t);
  }, [params.q]);

  return useQuery({
    queryKey: ["search", debouncedQ, params.org, params.lang, params.page],
    queryFn: () => searchApi.search({ ...params, q: debouncedQ }),
    enabled: debouncedQ.trim().length >= 2,
    staleTime: 10_000,
  });
}
