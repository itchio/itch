import React from "react";
import { Dispatch } from "common/types";
import { hook } from "renderer/hocs/hook";
import { T } from "renderer/t";
import styled from "renderer/styles";
import Button from "renderer/basics/Button";
import { actions } from "common/actions";

const ControlButtonsDiv = styled.div`
  padding: 12px;
  padding-top: 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

class InstallLocationSettings extends React.Component<Props> {
  render() {
    return (
      <>
        <h2>{T(["preferences.install_locations"])}</h2>
        <ControlButtonsDiv>
          <Button
            icon="cog"
            label={T(["install_locations.manage"])}
            onClick={this.onManage}
          />
        </ControlButtonsDiv>
      </>
    );
  }

  onManage = () => {
    const { dispatch } = this.props;
    dispatch(
      actions.navigate({
        wind: "root",
        url: "itch://locations",
      })
    );
  };
}

interface Props {
  dispatch: Dispatch;
}

export default hook()(InstallLocationSettings);
