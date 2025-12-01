export interface GetRequestInterface {
  searchValue: string;
  limit: number;
  page: number;
  total: number;
}

export type PostResponse = {
  success: boolean;
  message: string;
  operation_type: string;
  record_id: number;
};

export type ApiGetResponse<T> = {
  total_count: number;
  data: T;
  misc: {
    total: number;
    lastPage: number;
  };
};

export type ApiPostResponse = {
  data: PostResponse;
};

export interface IPagination {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  firstPage: number;
  firstPageUrl: string;
  lastPageUrl: string;
  nextPageUrl: string | null;
  previousPageUrl: string | null;
}
