import { paginationStore } from "@src/app/stores/paginationStore";

export function usePagination() {
  const limit = paginationStore((state) => state.limit);
  const offset = paginationStore((state) => state.page);
  const searchTerm = paginationStore((state) => state.searchValue);

  return {
    operation: searchTerm.length > 0 ? "BySearch" : "All",
    searchValue: searchTerm,
    limit,
    page: offset,
  };
}
