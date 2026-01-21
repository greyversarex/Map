import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LocationMedia, InsertLocationMedia } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useLocationMedia(locationId: number) {
  return useQuery<LocationMedia[]>({
    queryKey: ["/api/locations", locationId, "media"],
    enabled: !!locationId,
  });
}

export function useCreateLocationMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ locationId, ...data }: { locationId: number } & Omit<InsertLocationMedia, "locationId">) => {
      const res = await apiRequest("POST", `/api/locations/${locationId}/media`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", variables.locationId, "media"] });
    },
  });
}

export function useUpdateLocationMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, locationId, ...updates }: { id: number; locationId: number } & Partial<InsertLocationMedia>) => {
      const res = await apiRequest("PUT", `/api/media/${id}`, updates);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", variables.locationId, "media"] });
    },
  });
}

export function useDeleteLocationMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, locationId }: { id: number; locationId: number }) => {
      await apiRequest("DELETE", `/api/media/${id}`);
      return { locationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations", data.locationId, "media"] });
    },
  });
}
