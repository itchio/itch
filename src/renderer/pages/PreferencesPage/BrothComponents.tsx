import { actions } from "common/actions";
import React from "react";
import Icon from "renderer/basics/Icon";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import BrothComponent from "renderer/pages/PreferencesPage/BrothComponent";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";

const CheckUpdatesButton = styled.button`
  ${styles.resetButton};
  margin-left: 10px;
  border-bottom: 1px solid;
  cursor: pointer;
`;

const BrothComponents = () => {
  const dispatch = useAppDispatch();
  const packageNames = useAppSelector((rs) => rs.broth.packageNames);

  const checkForUpdates = () => {
    dispatch(actions.checkForComponentUpdates({ manual: true }));
  };

  return (
    <div className="section">
      <Icon icon="list" /> {T(["preferences.advanced.components"])}
      <CheckUpdatesButton type="button" onClick={checkForUpdates}>
        {T(["menu.help.check_for_update"])}
      </CheckUpdatesButton>
      {packageNames.map((name) => (
        <BrothComponent key={name} name={name} />
      ))}
    </div>
  );
};

export default BrothComponents;
