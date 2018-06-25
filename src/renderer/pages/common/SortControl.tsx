import { LocalizedString } from "common/types";
import React from "react";
import { SortGroup, SortOption } from "renderer/pages/common/SortsAndFilters";

export interface Sort {
  value: string;
  label: LocalizedString;
}

export type Sorts = Sort[];

interface Props {
  sorts: Sorts;
}

export default ({ sorts }: Props) => (
  <SortGroup>
    {sorts.map(sort => {
      const { value, label } = sort;
      return (
        <SortOption
          key={value}
          icon="sort-alpha-asc"
          optionKey="sortBy"
          optionValue={value}
          label={label}
        />
      );
    })}
  </SortGroup>
);
