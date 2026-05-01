import { actions } from "common/actions";
import { Dispatch, RootState } from "common/types";
import { ambientTab, ambientWind } from "common/util/navigation";
import React from "react";
import { hookWithProps } from "renderer/hocs/hook";
import { urlWithParams } from "renderer/hocs/tab-utils";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const Bar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.baseText};
  cursor: pointer;

  &:hover {
    color: ${(props) => props.theme.baseText};
  }

  &.active {
    background: ${(props) => props.theme.itemBackground};
    color: ${(props) => props.theme.baseText};
    border-color: ${(props) => props.theme.inputBorder};
  }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 4px;
  background: ${(props) => props.theme.sidebarBackground};
  color: ${(props) => props.theme.baseText};
  font-size: 80%;
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
  url: string;
  dispatch: Dispatch;
}

type Props = OwnProps & MappedProps;

class Filters extends React.PureComponent<Props> {
  override render() {
    const { status, totals } = this.props;
    return (
      <Bar>
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            className={status === f.value ? "active" : ""}
            onClick={() => this.setStatus(f.value)}
          >
            <span>{T(_(f.labelKey))}</span>
            {totals ? <Badge>{totals[f.totalKey]}</Badge> : null}
          </Chip>
        ))}
      </Bar>
    );
  }

  setStatus = (status: StatusFilter) => {
    const { dispatch, tab, url } = this.props;
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
    const q = ambientTab(rs, props).location.query;
    const s = (q.status ?? "") as StatusFilter;
    if (s === "live" || s === "processing" || s === "failed") return s;
    return "" as StatusFilter;
  }),
  url: map(
    (rs: RootState, props: OwnProps) => ambientTab(rs, props).location.url
  ),
}))(Filters);
