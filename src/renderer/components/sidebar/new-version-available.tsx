import React from "react";
import styled from "../styles";
import { T } from "renderer/t";
import Icon from "renderer/components/basics/icon";
import { actionCreatorsList, Dispatchers, connect } from "../connect";
import { IRootState } from "common/types";

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
    background: ${props => props.theme.baseBackground};
    cursor: pointer;
  }
`;

const Spacer = styled.div`
  height: 1px;
  width: 0.4em;
`;

class NewVersionAvailable extends React.PureComponent<IDerivedProps> {
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
    this.props.relaunchRequest({});
  };
}

const actionCreators = actionCreatorsList("relaunchRequest");
type IDerivedProps = Dispatchers<typeof actionCreators> & {
  available?: boolean;
};

export default connect(NewVersionAvailable, {
  state: (rs: IRootState): Partial<IDerivedProps> => {
    const pkg = rs.broth.packages[rs.system.appName];
    const available = pkg && pkg.stage === "need-restart";
    return { available };
  },
  actionCreators,
});
