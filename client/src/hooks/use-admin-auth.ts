import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AdminUser {
  username: string;
}

interface SessionResponse {
  isAdmin: boolean;
  user?: AdminUser;
}

async function fetchSession(): Promise<SessionResponse> {
  const response = await fetch("/api/admin/session", {
    credentials: "include",
  });
  return response.json();
}

async function logout(): Promise<void> {
  await fetch("/api/admin/logout", {
    method: "POST",
    credentials: "include",
  });
}

export function useAdminAuth() {
  const queryClient = useQueryClient();
  
  const { data, isLoading } = useQuery<SessionResponse>({
    queryKey: ["/api/admin/session"],
    queryFn: fetchSession,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/admin/session"], { isAdmin: false });
    },
  });

  return {
    isAdmin: data?.isAdmin ?? false,
    user: data?.user,
    isLoading,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
