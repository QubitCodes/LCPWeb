import { create } from "zustand";

export type LimitStore = {
  limit: number;
  page: number;
  setLimit: (limit: number) => void;
  setpage: (page: number) => void;
  nextpage: () => void;
  prevpage: () => void;
  resetpage: () => void;
  searchValue: string;
  setsearchValue: (searchValue: string) => void;
};

export const paginationStore = create<LimitStore>((set) => ({
  limit: 10,
  page: 0,
  searchValue: "",
  setLimit: (limit: number) => set({ limit }),
  setpage: (page: number) => set({ page }),
  setsearchValue: (searchValue: string) => set({ searchValue, page: 1 }),
  nextpage: () => set((state) => ({ page: state.page + 1 })),
  prevpage: () => set((state) => ({ page: state.page - 1 })),
  resetpage: () => set({ page: 0 }),
}));
