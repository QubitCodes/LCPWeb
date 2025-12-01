import { api } from "@src/lib/axios";
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export interface UseDeleteMutationOptions<TData> {
  name?: string;
  endpoint: string;
  queryKeyToInvalidate?: string[];
}

export function useDeleteMutation<TData>(
  options: UseDeleteMutationOptions<TData>
): UseMutationResult<TData, Error, number> {
  const queryClient = useQueryClient();

  // ✅ must return the mutation object
  return useMutation<TData, Error, number>({
    mutationFn: async (id: number, params) => {
      const response = await api.delete<TData>(`${options.endpoint}${id}`, {
        params: params ?? {},
      });
      return response.data;
    },
    onSuccess: () => {
      if (options.queryKeyToInvalidate) {
        queryClient.invalidateQueries({
          queryKey: options.queryKeyToInvalidate,
        });
      }
      toast.success(`${options.name} Deleted successfully!`);
    },
    onError: (err) => {
      console.log(err);
      toast.error("Something went wrong!");
    },
  });
}
