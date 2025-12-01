import { API_ENDPOINTS } from "@src/constants/apiEndPoints";
import { QUERY_KEYS } from "@src/constants/queryKey";
import { useDeleteMutation } from "@src/hooks/commons/useDeleteMutation";
import { useGetData } from "@src/hooks/commons/useGetData";
import { useAppMutation } from "@src/hooks/commons/useMutationData";
import { ApiGetResponse } from "@src/types/common";
import { Address, IUser } from "@src/types/user";

export const useGetAllContractor = (roleType: number) => {
  return useGetData<ApiGetResponse<IUser[]>>({
    endpoint: API_ENDPOINTS.getAllContrctor,
    queryKey: QUERY_KEYS.getAllContrctor,
    params: { roleType },
  });
};

export const useUpsertContractor = () => {
  return useAppMutation({
    endpoint: API_ENDPOINTS.postUser,
    method: "POST",
    queryKeyToInvalidate: [QUERY_KEYS.getAllContrctor],
    name: "Contractor",
  });
};

export const useDeleteContractor = () => {
  return useDeleteMutation({
    endpoint: API_ENDPOINTS.deleteUser,
    queryKeyToInvalidate: [QUERY_KEYS.getAllContrctor],
    name: "User",
  });
};

export const useGetUserAddress = (id: number) => {
  return useGetData<ApiGetResponse<Address[]>>({
    endpoint: API_ENDPOINTS.get_user_address,
    queryKey: QUERY_KEYS.get_user_address,
    params: { userId: id },
  });
};
