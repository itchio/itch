import React from "react";
import { connect, actionCreatorsList, Dispatchers } from "../connect";

import { ModalWidgetDiv } from "./modal-widget";

import { IRootState } from "common/types";

import styled from "../styles";
import Button from "../basics/button";
import { modalWidgets, IModalWidgetProps } from "./index";
import { doAsync } from "../do-async";
import { call } from "common/butlerd";
import { createRequest } from "butlerd";

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
          <Button
            className="control"
            primary={true}
            icon="bug"
            onClick={this.onBadButlerdCall}
            label="Call non-existent butlerd endpoint"
          />
          <Button
            className="control"
            primary={true}
            icon="bug"
            onClick={this.onOpenCrashy}
            label="Open crashy tab"
          />
          <Button
            className="control"
            primary={true}
            icon="bug"
            onClick={this.onOpenWindow}
            label="Open window"
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
    const chromeStore = (await import("renderer/store")).default;
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

  onBadButlerdCall = () => {
    const FakeRequest = createRequest<{}, {}>(
      "This.Is.Definitely.Not.A.Butlerd.Method"
    );

    doAsync(async () => {
      let e: Error;
      try {
        await call(FakeRequest, {});
      } catch (ee) {
        e = ee;
      }

      this.props.openModal(
        modalWidgets.showError.make({
          title: "test butlerd internal error",
          message: "This is a test butlerd error",
          detail: "It's fun to snoop!",
          widgetParams: {
            rawError: e,
            log: "no log",
          },
          buttons: [
            {
              label: ["prompt.action.continue"],
            },
          ],
        })
      );
    });
  };

  onOpenCrashy = () => {
    this.props.navigate({ url: "itch://crashy" });
    this.props.closeModal({});
  };

  onOpenWindow = () => {
    this.props.openWindow({ tab: "itch://preferences" });
    this.props.closeModal({});
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
  "closeModal",
  "reloadLocales",
  "openDevTools",
  "navigate",
  "openWindow"
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
