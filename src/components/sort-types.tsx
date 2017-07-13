export type SortDirection = "ASC" | "DESC";

export type SortKey = "title" | "secondsRun" | "lastTouchedAt" | "publishedAt";

export interface ISortParams {
  sortBy: SortKey;
  sortDirection: SortDirection;
}

export interface IOnSortChange {
  (params: ISortParams): void;
}
