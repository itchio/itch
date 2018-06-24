import { Space } from "common/helpers/space";
import { LocalizedString } from "common/types";
import React from "react";
import { withSpace } from "renderer/hocs/withSpace";
import { SortGroup, SortOption } from "renderer/pages/common/SortsAndFilters";

export interface Sort {
  value: string;
  label: LocalizedString;
}

export type Sorts = Sort[];

interface Props {
  sorts: Sorts;
  space: Space;
}

export default withSpace(({ sorts, space }: Props) => (
  <SortGroup>
    {sorts.map(sort => {
      const { value, label } = sort;
      return (
        <SortOption
          key={value}
          icon="sort-alpha-asc"
          space={space}
          optionKey="sortBy"
          optionValue={value}
          label={label}
        />
      );
    })}
  </SortGroup>
));
