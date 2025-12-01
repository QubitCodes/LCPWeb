import { api } from "@src/lib/axios";
import {
  useMutation,
  UseMutationResult,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

export type ApiPostResponse<T = unknown> = {
  status: boolean;
  message: string;
  code: number;
  data?: T | null;
  misc?: Record<string, unknown>;
  errors?: { field?: string; message: string }[];
};

export interface UseAppMutationOptions<TData, TVariables> {
  endpoint: string;
  method?: "POST" | "PUT" | "DELETE";
  queryKeyToInvalidate?: string[];
  name?: string;
  onSuccess?: (data: ApiPostResponse<TData>) => void;
}

export function useAppMutation<TData = unknown, TVariables = unknown>(
  options: UseAppMutationOptions<TData, TVariables>
): UseMutationResult<ApiPostResponse<TData>, Error, TVariables> {
  const queryClient = useQueryClient();

  return useMutation<ApiPostResponse<TData>, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const payload = {
        ...variables,
        createdBy: 0,
      };

      const method = options.method ?? "POST";

      const response = await api.request<ApiPostResponse<TData>>({
        url: options.endpoint,
        method,
        data: payload,
      });
      console.log("response", response);
      return response.data;
    },

    onSuccess: (data, variables, context) => {
      // Always show the success toast and invalidate queries first.
      if (options.queryKeyToInvalidate) {
        queryClient.invalidateQueries({
          queryKey: options.queryKeyToInvalidate,
        });
      }
      toast.success(
        data.message || `${options.name || "Record"} saved successfully!`
      );

      // Then, if a custom onSuccess callback is provided, execute it.
      if (options.onSuccess) {
        options.onSuccess(data);
      }
    },

    onError: (error) => {
      let message = "Something went wrong";

      if (axios.isAxiosError(error)) {
        console.log("axios err", error.response?.data);
        message = error.response?.data?.message || error.message;
      } else {
        message = error.message;
      }

      toast.error(message);
    },
  });
}
