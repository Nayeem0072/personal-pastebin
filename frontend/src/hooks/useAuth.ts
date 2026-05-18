import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { ApiError, getToken, setToken } from "../api/client";

export function useAuth() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setToken(null); // invalid/expired token — clear it so we stop trying
        }
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    enabled: !!getToken(),
  });

  const logout = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      qc.setQueryData(["me"], null);
      qc.removeQueries({ queryKey: ["me"] });
      navigate("/", { replace: true });
    },
  });

  return {
    user: data?.user ?? null,
    isLoading: isLoading && !!getToken(), // only "loading" if we actually have a token to check
    isLoggedIn: !!data?.user,
    logout: logout.mutate,
    logoutAsync: logout.mutateAsync,
  };
}
