import { IRootState } from "../../types/index";
import { connect } from "../connect";
import * as React from "react";
import styled from "../styles";
import * as classNames from "classnames";

import { actions, dispatcher } from "../../actions";

const SearchDiv = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 20;

  background: rgba(0, 0, 0, 0);
  transition: background 0.2s;
  pointer-events: none;

  &.open {
    background: rgba(0, 0, 0, 0.7);
    pointer-events: initial;
  }
`;

class SearchDimmer extends React.Component<IDerivedProps> {
  render() {
    const { open } = this.props;
    return (
      <SearchDiv className={classNames({ open })} onClick={this.onClick} />
    );
  }

  onClick = () => {
    this.props.closeSearch({});
  };
}

interface IDerivedProps {
  open: boolean;

  closeSearch: typeof actions.closeSearch;
}

export default connect<{}>(SearchDimmer, {
  state: (rs: IRootState) => ({
    open: rs.session.search.open,
  }),
  dispatch: dispatch => ({
    closeSearch: dispatcher(dispatch, actions.closeSearch),
  }),
});
