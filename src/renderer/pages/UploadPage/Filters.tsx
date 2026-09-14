import classNames from "classnames";
import { actions } from "common/actions";
import { Dispatch, RootState } from "common/types";
import { ambientTab, ambientWind } from "common/util/navigation";
import React from "react";
import { hookWithProps } from "renderer/hocs/hook";
import { urlWithParams } from "renderer/hocs/tab-utils";
import {
  FilterGroup,
  FilterOptionButton,
  FilterOptionIcon,
} from "renderer/pages/common/SortsAndFilters";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

// match the height of the push new build button next to it
const ToolbarFilterGroup = styled(FilterGroup)`
  margin: 0;

  > * {
    min-height: 38px;
    box-sizing: border-box;
  }
`;

// goes inside the label span so it sits on the same baseline as the text
const Count = styled.span`
  margin-left: 0.5em;
  font-size: 85%;
  opacity: 0.6;
`;

export type StatusFilter = "" | "live" | "processing" | "failed";

const FILTERS: {
  value: StatusFilter;
  labelKey: string;
  totalKey: keyof Totals;
}[] = [
  { value: "", labelKey: "upload.filter.all", totalKey: "all" },
  { value: "live", labelKey: "upload.filter.live", totalKey: "live" },
  {
    value: "processing",
    labelKey: "upload.filter.processing",
    totalKey: "processing",
  },
  { value: "failed", labelKey: "upload.filter.failed", totalKey: "failed" },
];

interface Totals {
  all: number;
  live: number;
  processing: number;
  failed: number;
}

interface OwnProps {
  totals?: Totals;
  tab: string;
}

interface MappedProps {
  status: StatusFilter;
  url: string | undefined;
  dispatch: Dispatch;
}

type Props = OwnProps & MappedProps;

class Filters extends React.PureComponent<Props> {
  override render() {
    const { status, totals } = this.props;
    return (
      <ToolbarFilterGroup>
        {FILTERS.map((f) => {
          const active = status === f.value;
          return (
            <FilterOptionButton
              key={f.value}
              className={classNames({ active })}
              onClick={() => this.setStatus(f.value)}
            >
              <FilterOptionIcon
                className={classNames({ inactive: !active })}
                icon={active ? "checkbox-checked" : "filter"}
              />
              <span>
                {T(_(f.labelKey))}
                {totals ? <Count>{totals[f.totalKey]}</Count> : null}
              </span>
            </FilterOptionButton>
          );
        })}
      </ToolbarFilterGroup>
    );
  }

  setStatus = (status: StatusFilter) => {
    const { dispatch, tab, url } = this.props;
    if (!url) {
      // tab hasn't derived a location yet, nothing to evolve
      return;
    }
    dispatch(
      actions.evolveTab({
        wind: ambientWind(),
        tab,
        url: urlWithParams(url, { status }),
        replace: true,
      })
    );
  };
}

export default hookWithProps(Filters)((map) => ({
  status: map((rs: RootState, props: OwnProps) => {
    const q = ambientTab(rs, props).location?.query;
    const s = (q?.status ?? "") as StatusFilter;
    if (s === "live" || s === "processing" || s === "failed") return s;
    return "" as StatusFilter;
  }),
  url: map(
    (rs: RootState, props: OwnProps) => ambientTab(rs, props).location?.url
  ),
}))(Filters);
