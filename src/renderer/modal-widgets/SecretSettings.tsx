import { createRequest } from "butlerd";
import { call } from "common/butlerd";
import { IRootState } from "common/types";
import React from "react";
import Button from "renderer/basics/Button";
import { doAsync } from "renderer/helpers/doAsync";
import {
  actionCreatorsList,
  connect,
  Dispatchers,
} from "renderer/hocs/connect";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { ModalWidgetProps, modalWidgets } from "./index";

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

class SecretSettings extends React.PureComponent<Props & DerivedProps> {
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
        window: "root",
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
        window: "root",
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
          window: "root",
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
    this.props.navigate({ window: "root", url: "itch://crashy" });
    this.props.closeModal({ window: "root" });
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

export interface SecretSettingsParams {}

interface Props extends ModalWidgetProps<SecretSettingsParams, void> {
  params: SecretSettingsParams;
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

type DerivedProps = Dispatchers<typeof actionCreators> & {
  status: IRootState["status"];
};

export default connect<Props>(
  SecretSettings,
  {
    state: (rs: IRootState) => ({
      status: rs.status,
    }),
    actionCreators,
  }
);
