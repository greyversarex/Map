import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Book, CreateBookRequest, UpdateBookRequest } from "@shared/schema";

export function useBooks() {
  return useQuery<Book[]>({
    queryKey: ["/api/books"],
  });
}

export function useBook(id: number) {
  return useQuery<Book>({
    queryKey: ["/api/books", id],
    enabled: !!id,
  });
}

export function useCreateBook() {
  return useMutation({
    mutationFn: async (data: CreateBookRequest) => {
      const response = await apiRequest("POST", "/api/books", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
  });
}

export function useUpdateBook() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateBookRequest }) => {
      const response = await apiRequest("PUT", `/api/books/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
  });
}

export function useDeleteBook() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
    },
  });
}