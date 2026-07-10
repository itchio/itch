import classNames from "classnames";
import { Dispatch, LocalizedString } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import SimpleSelect, {
  Bar,
  BaseOptionType,
  IconWrapper,
} from "renderer/basics/SimpleSelect";
import { hookWithProps } from "renderer/hocs/hook";
import { dispatchTabEvolve, urlWithParams } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import {
  FilterOptionIcon,
  optionButtonLike,
} from "renderer/pages/common/SortsAndFilters";
import styled from "renderer/styles";

const FilterDropdownDiv = styled.div`
  ${optionButtonLike};
  padding: 0 0 0 1em;
`;

// SimpleSelect is styled for forms (opaque input background, generous
// min-width); strip that down so it reads as part of the filter bar.
const FilterSelect = styled(SimpleSelect)`
  flex-grow: 0;

  > button {
    background: none;
    border: none;
    color: inherit;

    &:hover {
      border: none;
      cursor: pointer;
    }

    /* value row */
    > div {
      min-width: 7em;
      min-height: 0;
      padding: 0.5em 0 0.5em 0.5em;
    }
  }

  ${Bar} {
    display: none;
  }

  ${IconWrapper} {
    padding-left: 0.5em;
    padding-right: 0.7em;
  }

  /* options popup */
  > div:last-child > div {
    background: ${(props) => props.theme.inputBackground};

    > div {
      min-width: 0;
      min-height: 0;
      padding: 0.5em 0.8em;
    }
  }
`;

/**
 * A compact query-param-driven filter: renders as a single dropdown
 * instead of a row of segmented buttons. The first option clears the
 * param ("any"); picking a value sets `?optionKey=value` on the tab URL,
 * like FilterOption does.
 */
class FilterDropdownBase extends React.PureComponent<FilterDropdownProps> {
  override render() {
    const { value, options, allLabel } = this.props;
    const active = !!value;

    const allOptions: BaseOptionType[] = [
      { value: "", label: allLabel },
      ...options,
    ];
    const current =
      allOptions.find((o) => o.value === (value || "")) || allOptions[0];

    return (
      <FilterDropdownDiv className={classNames({ active })}>
        <FilterOptionIcon
          className={classNames({ inactive: !active })}
          icon={active ? "checkbox-checked" : "filter"}
        />
        <FilterSelect
          options={allOptions}
          value={current}
          onChange={this.onChange}
        />
      </FilterDropdownDiv>
    );
  }

  onChange = (option: BaseOptionType) => {
    const { url, optionKey } = this.props;
    if (!url) {
      // tab hasn't derived a location yet, nothing to evolve
      return;
    }
    dispatchTabEvolve(this.props, {
      replace: true,
      url: urlWithParams(url, { [optionKey]: option.value || undefined }),
    });
  };
}

export interface FilterDropdownOption {
  value: string;
  label: LocalizedString;
}

interface FilterDropdownProps {
  tab: string;
  dispatch: Dispatch;

  optionKey: string;
  allLabel: LocalizedString;
  options: FilterDropdownOption[];

  url: string | undefined;
  value: string | undefined;
}

const hooked = hookWithProps(FilterDropdownBase)((map) => ({
  url: map((rs, props) => ambientTab(rs, props).location?.url),
  value: map(
    (rs, props) => ambientTab(rs, props).location?.query[props.optionKey]
  ),
}))(FilterDropdownBase);
export const FilterDropdown = withTab(hooked);
