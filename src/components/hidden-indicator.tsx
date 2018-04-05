import React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";

import IconButton from "./basics/icon-button";

import styled from "./styles";
import { darken } from "polished";

import format from "./format";

const HiddenIndicatorDiv = styled.div`
  background: ${props => props.theme.meatBackground};
  box-shadow: 0 0 2px 0 ${props => darken(0.2, props.theme.meatBackground)};
  border-radius: 4px 0 0 0;
  position: fixed;
  right: 0;
  bottom: 0;
  padding: 8px;
  color: ${props => props.theme.secondaryText};

  display: flex;
  align-items: center;
`;

class HiddenIndicator extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { tab, count, clearFilters } = this.props;

    if (!count) {
      return null;
    }

    return (
      <HiddenIndicatorDiv>
        <IconButton
          className="indicator-clear-filters"
          icon="delete"
          hint={["grid.clear_filters"]}
          onClick={() => clearFilters({ tab })}
        />{" "}
        {format(["grid.hidden_count", { count }])}
      </HiddenIndicatorDiv>
    );
  }
}

interface IProps {
  tab: string;
  count: number;
}

const actionCreators = actionCreatorsList("clearFilters");

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(HiddenIndicator, { actionCreators });
