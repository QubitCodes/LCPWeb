import { API_ENDPOINTS } from "@src/constants/apiEndPoints";
import { QUERY_KEYS } from "@src/constants/queryKey";
import { api } from "@src/lib/axios";
import { useQuery } from "@tanstack/react-query";

export const useStates = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.get_states],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.get_states);
      console.log({ response });

      return response.data.data;
    },
  });
};
