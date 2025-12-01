import { API_ENDPOINTS } from "@src/constants/apiEndPoints";
import { QUERY_KEYS } from "@src/constants/queryKey";
import { ApiGetResponse } from "@src/types/common";
import { Address } from "@src/types/user";
import { useGetData } from "../commons/useGetData";
import { useAppMutation } from "../commons/useMutationData";

export const useGetCrntUserAddress = () => {
  return useGetData<ApiGetResponse<Address[]>>({
    endpoint: API_ENDPOINTS.get_crnt_user_address,
    queryKey: QUERY_KEYS.get_crnt_user_address,
    params: {},
  });
};

export const useUpsertAddress = () => {
  return useAppMutation({
    endpoint: API_ENDPOINTS.save_user_address,
    method: "POST",
    queryKeyToInvalidate: [QUERY_KEYS.get_crnt_user_address],
    name: "Address",
  });
};
