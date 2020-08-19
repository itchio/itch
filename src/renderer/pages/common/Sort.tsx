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

const SortOptionBase = (props: SortOptionsProps) => {
  const { url, active, reverse, sortBy, label } = props;
  let href: string;

  let baseClass = `sortby--${sortBy}`;
  if (!active) {
    baseClass = `${baseClass}--default`;
    href = urlWithParams(url, { sortBy, sortDir: "default" });
  } else {
    if (!reverse) {
      baseClass = `${baseClass}--reverse`;
      href = urlWithParams(url, { sortBy, sortDir: "reverse" });
    } else {
      baseClass = `${baseClass}--disable`;
      href = urlWithParams(url, { sortBy: undefined, sortDir: undefined });
    }
  }

  return (
    <FilterOptionLink
      target="_replace"
      href={href}
      className={classNames(baseClass, { active })}
    >
      <FilterOptionIcon
        className={classNames({ inactive: !active })}
        icon={active && reverse ? "sort-amount-desc" : "sort-amount-asc"}
      />
      {T(label)}
    </FilterOptionLink>
  );
};

interface SortOptionsProps {
  sortBy: string;
  label: LocalizedString;

  tab: string;
  dispatch: Dispatch;

  url: string;
  active: boolean;
  reverse: boolean;
}

const hooked = hookWithProps(SortOptionBase)((map) => ({
  url: map((rs, props) => ambientTab(rs, props).location.url),
  active: map(
    (rs, props) => ambientTab(rs, props).location.query.sortBy === props.sortBy
  ),
  reverse: map(
    (rs, props) => ambientTab(rs, props).location.query.sortDir === "reverse"
  ),
}))(SortOptionBase);
export const SortOption = withTab(hooked);
