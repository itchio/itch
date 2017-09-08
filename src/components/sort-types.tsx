export type SortDirection = "ASC" | "DESC";

export type SortKey =
  | "title"
  | "secondsRun"
  | "lastTouchedAt"
  | "publishedAt"
  | "installedSize";

export interface ISortParams {
  sortBy: SortKey;
  sortDirection: SortDirection;
}

export interface IOnSortChange {
  (params: ISortParams): void;
}
