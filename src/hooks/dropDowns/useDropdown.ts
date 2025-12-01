import { API_ENDPOINTS } from "@src/constants/apiEndPoints";
import { QUERY_KEYS } from "@src/constants/queryKey";
import { api } from "@src/lib/axios";
import { useQuery } from "@tanstack/react-query";
import { useGetData } from "../commons/useGetData";

export type IDropdown = {
  id: number;
  name: string;
};

export const useCompanyDropdown = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.get_company_dropdown],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.get_company_dropdown);
      console.log("useCompanyDropdown", response);

      return response.data;
    },
  });
};

export const useBusinessVerticalDropdown = () => {
  return useGetData<IDropdown[]>({
    endpoint: API_ENDPOINTS.get_busyness_vertical_dropdown,
    queryKey: QUERY_KEYS.get_busyness_verticals_dropdown,
  });
};

export const useDivisionDropdown = () => {
  return useGetData<IDropdown[]>({
    endpoint: API_ENDPOINTS.get_division_dropdown,
    queryKey: QUERY_KEYS.get_divisions_dropdown,
  });
};

export const useCountryDropdown = () => {
  return useGetData<IDropdown[]>({
    endpoint: API_ENDPOINTS.get_country_dropdown,
    queryKey: QUERY_KEYS.get_countries_dropdown,
  });
};
