import { API_ENDPOINTS } from "@src/constants/apiEndPoints";
import { QUERY_KEYS } from "@src/constants/queryKey";
import { api } from "@src/lib/axios";
import { useQuery } from "@tanstack/react-query";

export const useGetAllDistricts = (stateId: number | undefined) => {
  return useQuery({
    queryKey: [QUERY_KEYS.get_districts, stateId],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.get_districts, {
        params: {
          stateId,
        },
      });
      return response.data.data;
    },
    // Only run the query if stateId is a valid number
    enabled: !!stateId && stateId > 0,
  });
};
