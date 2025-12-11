import { actions } from "common/actions";
import React from "react";
import Icon from "renderer/basics/Icon";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import styled from "renderer/styles";
import { T } from "renderer/t";

const Container = styled.div.withConfig({
  displayName: "NewVersionAvailable-Container",
})`
  align-self: stretch;
  font-weight: bold;
  padding: 0 0.5em;
  margin-right: 1em;

  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4em;
  border-radius: 2px;

  &:hover {
    background: ${(props) => props.theme.baseBackground};
    cursor: pointer;
  }
`;

const NewVersionAvailable = () => {
  const dispatch = useAppDispatch();
  const available = useAppSelector((rs) => {
    const pkg = rs.broth.packages[rs.system.appName];
    return pkg && pkg.stage === "need-restart";
  });

  if (!available) {
    return null;
  }

  const onClick = () => {
    dispatch(actions.relaunchRequest({}));
  };

  return (
    <Container onClick={onClick}>
      <Icon icon="install" />
      {T(["prompt.self_update_ready.short"])}
    </Container>
  );
};

export default React.memo(NewVersionAvailable);
