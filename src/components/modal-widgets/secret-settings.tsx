import * as React from "react";
import { connect, actionCreatorsList, Dispatchers } from "../connect";

import { ModalWidgetDiv } from "./modal-widget";

import { IRootState } from "../../types/index";

import styled from "../styles";
import Button from "../basics/button";
import { modalWidgets, IModalWidgetProps } from "./index";

const ControlsDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  .control {
    margin: 12px 0;
  }

  label {
    padding: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    border-left: 2px solid ${props => props.theme.prefBorder};
  }

  input[type="checkbox"] {
    margin-right: 0.4em;
  }
`;

class SecretSettings extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { status } = this.props;

    return (
      <ModalWidgetDiv>
        <ControlsDiv>
          <label className="control">
            <input
              type="checkbox"
              value="Redux logging"
              checked={status.reduxLoggingEnabled}
              onChange={this.toggleReduxLogging}
            />
            <span>Enable redux logging</span>
          </label>
          <Button
            className="control"
            primary={true}
            icon="repeat"
            onClick={this.onReload}
            label="Reload entire page"
          />
          <Button
            className="control"
            primary={true}
            icon="earth"
            onClick={this.onReloadLocales}
            label="Reload locales"
          />
          <Button
            className="control"
            primary={true}
            icon="bug"
            onClick={this.onViewAppState}
            label="View app state"
          />
          <Button
            className="control"
            primary={true}
            icon="palette"
            onClick={this.onGPUFeatureStatus}
            label="View GPU feature status"
          />
        </ControlsDiv>
      </ModalWidgetDiv>
    );
  }

  onReload = () => {
    window.location.reload();
  };

  onReloadLocales = () => {
    this.props.reloadLocales({});
  };

  onViewAppState = async () => {
    const chromeStore = (await import("../../store/chrome-store")).default;
    this.props.openModal(
      modalWidgets.exploreJson.make({
        title: "Redux app state",
        widgetParams: {
          data: chromeStore.getState(),
        },
        fullscreen: true,
      })
    );
  };

  onGPUFeatureStatus = () => {
    // sic.: the typings are wrong, they have
    // `getGpuFeatureStatus` but the correct casing is
    // `getGPUFeatureStatus`. See https://github.com/electron/electron/issues/10788
    // FIXME: remove workaround once upgrading to electron 1.8.x
    const app = require("electron").remote.app as any;
    const data = app.getGPUFeatureStatus();
    this.props.openModal(
      modalWidgets.exploreJson.make({
        title: "GPU feature status",
        widgetParams: {
          data,
        },
      })
    );
  };

  toggleReduxLogging = () => {
    const enabled = !this.props.status.reduxLoggingEnabled;
    this.props.setReduxLoggingEnabled({
      enabled,
    });

    if (enabled) {
      this.props.openDevTools({ forApp: true });
    }
  };
}

export interface ISecretSettingsParams {}

interface IProps extends IModalWidgetProps<ISecretSettingsParams, void> {
  params: ISecretSettingsParams;
}

const actionCreators = actionCreatorsList(
  "setReduxLoggingEnabled",
  "openModal",
  "reloadLocales",
  "openDevTools"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  status: IRootState["status"];
};

export default connect<IProps>(SecretSettings, {
  state: (rs: IRootState) => ({
    status: rs.status,
  }),
  actionCreators,
});
