import React from "react";
import classNames from "classnames";
import { Space } from "common/helpers/space";
import { LocalizedString } from "common/types";
import { withSpace } from "renderer/hocs/withSpace";
import {
  FilterOptionLink,
  FilterOptionIcon,
} from "renderer/pages/common/SortsAndFilters";
import { T } from "renderer/t";

interface FilterOptionProps {
  space: Space;
  optionKey: string;
  optionValue: string;
  label: LocalizedString;
}

export const FilterOption = withSpace((props: FilterOptionProps) => {
  const { space, optionKey, optionValue, label } = props;
  let href: string;
  const active = optionValue === space.queryParam(optionKey);
  if (active) {
    href = space.urlWithParams({ [optionKey]: undefined });
  } else {
    href = space.urlWithParams({ [optionKey]: optionValue });
  }
  const baseClass = `filter--${optionKey}-${optionValue}--${
    active ? "disable" : "enable"
  }`;
  return (
    <FilterOptionLink
      target="_replace"
      href={href}
      className={classNames(baseClass, { active })}
    >
      <FilterOptionIcon
        className={classNames({ inactive: !active })}
        icon={active ? "checkbox-checked" : "filter"}
      />

      {T(label)}
    </FilterOptionLink>
  );
});
