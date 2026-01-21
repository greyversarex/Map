import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { LocationType, InsertLocationType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useLocationTypes() {
  return useQuery<LocationType[]>({
    queryKey: ["/api/location-types"],
  });
}

export function useLocationType(id: number) {
  return useQuery<LocationType>({
    queryKey: ["/api/location-types", id],
    enabled: !!id,
  });
}

export function useCreateLocationType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertLocationType) => {
      const res = await apiRequest("POST", "/api/location-types", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/location-types"] });
    },
  });
}

export function useUpdateLocationType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertLocationType>) => {
      const res = await apiRequest("PUT", `/api/location-types/${id}`, updates);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/location-types"] });
    },
  });
}

export function useDeleteLocationType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/location-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/location-types"] });
    },
  });
}
