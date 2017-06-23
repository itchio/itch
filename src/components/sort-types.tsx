export type SortDirection = "ASC" | "DESC";

export type SortKey = "title" | "secondsRun" | "lastTouched" | "publishedAt";

export interface ISortParams {
  sortBy: SortKey;
  sortDirection: SortDirection;
}

export interface IOnSortChange {
  (params: ISortParams): void;
}
