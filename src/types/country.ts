import { ApiGetResponse } from "./common";

export interface ICountry {
  id: number;
  division_id: number;
  name: string;
  code: string;
  currency: string;
  timezone: string;
  createdby: number;
  createdon: string; // or Date if parsed
  modifiedby: number | null;
  modifiedon: string | null;
  isdelete: boolean;
  division: string;
}

export type CountryGetResponseData = ApiGetResponse<ICountry[]>;
