import classNames from "classnames";
import { actions } from "common/actions";
import React from "react";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import modals from "renderer/modals";
import styled, * as styles from "renderer/styles";
import { ambientWind } from "common/util/navigation";
import { isSecretClick } from "common/helpers/secret-click";
import appWhiteLogo from "static/images/logos/app-white.svg";

const LogoButton = styled.button.withConfig({
  displayName: "LogoButton",
})`
  ${styles.resetButton};

  text-align: center;
  cursor: pointer;

  margin-top: 10px;
  height: 59px;

  img {
    width: 110px;
    margin: 10px 0;
  }
`;

const Logo = () => {
  const dispatch = useAppDispatch();
  const appVersion = useAppSelector((rs) => rs.system.appVersion);

  const onClick = (e: React.MouseEvent<any>) => {
    if (isSecretClick(e)) {
      dispatch(
        actions.openModal(
          modals.secretSettings.make({
            wind: "root",
            title: "Secret settings",
            message: "",
            widgetParams: {},
          })
        )
      );
      return;
    }

    if (e.button === 0) {
      dispatch(
        actions.openUserMenu({
          wind: ambientWind(),
          clientX: e.clientX,
          clientY: e.clientY,
        })
      );
    }
  };

  return (
    <LogoButton
      type="button"
      title={appVersion}
      className={classNames("logo-div")}
      onClick={onClick}
    >
      <img src={appWhiteLogo} />
    </LogoButton>
  );
};

export default React.memo(Logo);
