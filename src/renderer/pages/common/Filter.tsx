import classNames from "classnames";
import { Dispatch, LocalizedString } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import { hookWithProps } from "renderer/hocs/hook";
import { urlWithParams } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import {
  FilterOptionIcon,
  FilterOptionLink,
} from "renderer/pages/common/SortsAndFilters";
import { T } from "renderer/t";

interface FilterOptionProps {
  tab: string;
  dispatch: Dispatch;
  optionKey: string;
  optionValue: string;
  label: LocalizedString;

  active: boolean;
  url: string;
}

const base = (props: FilterOptionProps) => {
  const { url, active, optionKey, optionValue, label } = props;
  let href: string;
  if (active) {
    href = urlWithParams(url, { [optionKey]: undefined });
  } else {
    href = urlWithParams(url, { [optionKey]: optionValue });
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
};
const hooked = hookWithProps(base)((map) => ({
  url: map((rs, props) => ambientTab(rs, props).location.url),
  active: map(
    (rs, props) =>
      ambientTab(rs, props).location.query[props.optionKey] ===
      props.optionValue
  ),
}))(base);
export const FilterOption = withTab(hooked);
