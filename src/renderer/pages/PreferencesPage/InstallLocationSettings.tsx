import React from "react";
import { T } from "renderer/t";
import styled from "renderer/styles";
import Button from "renderer/basics/Button";
import { actions } from "common/actions";
import { useAppDispatch } from "renderer/hooks/redux";

const ControlButtonsDiv = styled.div`
  padding: 0 15px;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const InstallLocationSettings = () => {
  const dispatch = useAppDispatch();

  const onManage = () => {
    dispatch(
      actions.navigate({
        wind: "root",
        url: "itch://locations",
      })
    );
  };

  return (
    <>
      <h2>{T(["preferences.install_locations"])}</h2>
      <ControlButtonsDiv>
        <Button
          icon="cog"
          label={T(["install_locations.manage"])}
          onClick={onManage}
        />
      </ControlButtonsDiv>
    </>
  );
};

export default InstallLocationSettings;
