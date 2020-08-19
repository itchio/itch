import { actions } from "common/actions";
import { Dispatch } from "common/types";
import React from "react";
import Icon from "renderer/basics/Icon";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import { T } from "renderer/t";

const Container = styled.div`
  align-self: stretch;
  font-weight: bold;
  padding: 0 0.5em;
  margin-right: 1em;

  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 2px;

  &:hover {
    background: ${(props) => props.theme.baseBackground};
    cursor: pointer;
  }
`;

const Spacer = styled.div`
  height: 1px;
  width: 0.4em;
`;

class NewVersionAvailable extends React.PureComponent<Props> {
  render() {
    const { available } = this.props;
    if (!available) {
      return null;
    }

    return (
      <Container onClick={this.onClick}>
        <Icon icon="install" />
        <Spacer />
        {T(["prompt.self_update_ready.short"])}
      </Container>
    );
  }

  onClick = () => {
    const { dispatch } = this.props;
    dispatch(actions.relaunchRequest({}));
  };
}

interface Props {
  dispatch: Dispatch;

  available: boolean;
}

export default hook((map) => ({
  available: map((rs) => {
    const pkg = rs.broth.packages[rs.system.appName];
    return pkg && pkg.stage === "need-restart";
  }),
}))(NewVersionAvailable);
