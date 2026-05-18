import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { ApiError } from "../api/client";

export function useAuth() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: () => authApi.me(),
    retry: (_, err) => !(err instanceof ApiError && err.status === 401),
    staleTime: 60_000,
  });

  const logout = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.setQueryData(["me"], null);
    },
  });

  return {
    user: data?.user ?? null,
    isLoading,
    isLoggedIn: !!data?.user,
    logout: logout.mutate,
    logoutAsync: logout.mutateAsync,
  };
}
