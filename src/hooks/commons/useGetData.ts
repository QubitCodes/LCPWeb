// src/hooks/useGetData.ts
import { api } from "@src/lib/axios";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { usePagination } from "./usePagination";

interface UseGetDataProps<TData> {
  endpoint: string;
  queryKey: string;

  // Allow ANY custom params (string, number, boolean, object, array)
  params?: Record<string, unknown>;

  options?: Omit<UseQueryOptions<TData>, "queryKey" | "queryFn">;
}

export const useGetData = <TData>({
  endpoint,
  queryKey,
  params = {},
  options,
}: UseGetDataProps<TData>) => {
  const pagination = usePagination();
  console.log({ pagination });

  return useQuery<TData>({
    queryKey: [queryKey, pagination, params, ,],

    queryFn: async () => {
      const response = await api.get<TData>(endpoint, {
        params: {
          ...pagination,
          ...params,
        },
      });

      return response.data;
    },

    ...options,
  });
};
