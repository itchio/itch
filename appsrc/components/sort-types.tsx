
export type SortDirectionType = "ASC" | "DESC";

export interface ISortParams {
  sortBy: string;
  sortDirection: SortDirectionType;
};

export interface IOnSortChange {
  (params: ISortParams): void;
}
