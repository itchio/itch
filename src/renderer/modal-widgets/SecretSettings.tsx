import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import {
  SecretSettingsParams,
  SecretSettingsResponse,
} from "common/modals/types";
import { Dispatch, RootState } from "common/types";
import React from "react";
import Button from "renderer/basics/Button";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
import { hook } from "renderer/hocs/hook";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { ModalWidgetProps } from "common/modals";
import modals from "renderer/modals";
import { electron, butlerd } from "renderer/bridge";
import { onRequest } from "common/helpers/bridge";
import { recordingLogger } from "common/logger";
import { rendererLogger } from "renderer/logger";

const ControlsDiv = styled.div`
  display: flex;
  align-items: flex-start;
  flex-flow: row wrap;
  max-width: 600px;

  .control {
    margin: 8px;
  }

  label {
    padding: 8px;
    display: flex;
    flex-direction: row;
    align-items: center;
    border-left: 2px solid ${(props) => props.theme.prefBorder};
  }

  input[type="checkbox"] {
    margin-right: 0.4em;
  }
`;

class SecretSettings extends React.PureComponent<Props> {
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
            icon="leaf"
            onClick={this.onDoubleTwice}
            label="Double twice"
          />
          <Button
            className="control"
            primary={true}
            icon="close"
            onClick={this.onExpireAll}
            label="Expire all data in local database"
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
            onClick={this.onSimulateLaunchCrash}
            label="Simulate launch crash"
          />
          <Button
            className="control"
            primary={true}
            icon="checkbox-checked"
            onClick={this.onRestartButler}
            label="Force butlerd restart"
          />
          <Button
            className="control"
            primary={true}
            icon="history"
            onClick={this.onViewChangelog}
            label="View changelog"
          />
        </ControlsDiv>
      </ModalWidgetDiv>
    );
  }

  onReload = () => {
    window.location.reload();
  };

  onReloadLocales = () => {
    const { dispatch } = this.props;
    dispatch(actions.reloadLocales({}));
  };

  onViewAppState = async () => {
    const chromeStore = (await import("renderer/store")).default;
    const { dispatch } = this.props;
    dispatch(
      actions.openModal(
        modals.exploreJson.make({
          wind: "root",
          title: "Redux app state",
          widgetParams: {
            data: chromeStore.getState(),
          },
          fullscreen: true,
        })
      )
    );
  };

  onGPUFeatureStatus = async () => {
    const data = await electron.getGPUFeatureStatus();
    const { dispatch } = this.props;
    dispatch(
      actions.openModal(
        modals.exploreJson.make({
          wind: "root",
          title: "GPU feature status",
          widgetParams: {
            data,
          },
        })
      )
    );
  };

  onBadButlerdCall = () => {
    const FakeRequest = butlerd.createRequest<{}, {}>(
      "This.Is.Definitely.Not.A.Butlerd.Method"
    );

    doAsync(async () => {
      let e: Error;
      try {
        await rcall(FakeRequest, {});
      } catch (ee) {
        e = ee;
      }

      const { dispatch } = this.props;
      dispatch(
        actions.openModal(
          modals.showError.make({
            wind: "root",
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
        )
      );
    });
  };

  onDoubleTwice = () => {
    doAsync(async () => {
      // investigate
      await rcall(messages.TestDoubleTwice, { number: 7 }, [
        onRequest(messages.TestDouble.__method, async ({ number }) => {
          return { number: number * 2 };
        }),
      ]);
    });
  };

  onExpireAll = () => {
    doAsync(async () => {
      await rcall(messages.FetchExpireAll, {});
    });
  };

  onOpenCrashy = () => {
    const { dispatch } = this.props;
    dispatch(actions.navigate({ wind: "root", url: "itch://crashy" }));
    dispatch(actions.closeModal({ wind: "root" }));
  };

  onSimulateLaunchCrash = () => {
    doAsync(async () => {
      const logger = recordingLogger(rendererLogger, "secret.launch");
      let err: Error;
      try {
        logger.info("Preparing to launch game (debug simulation)");
        logger.info("Resolving executable path");
        logger.warn("Executable is present but test mode will force a crash");
        throw new Error(
          "Simulated launch failure: process crashed before first frame"
        );
      } catch (e) {
        err = e;
      }

      const { dispatch } = this.props;
      dispatch(
        actions.openModal(
          modals.showError.make({
            wind: "root",
            title: "test launch crash",
            message: "This is a simulated launch crash for debug testing",
            detail: "Use this to verify error dialog log rendering",
            widgetParams: {
              rawError: err,
              log: logger.getLog(),
              forceDetails: true,
            },
            buttons: [
              {
                label: ["prompt.action.continue"],
              },
            ],
          })
        )
      );
    });
  };

  onViewChangelog = () => {
    const { dispatch } = this.props;
    dispatch(
      actions.openModal(
        modals.viewChangelog.make({
          wind: "root",
          title: "Changelog",
          widgetParams: {},
        })
      )
    );
  };

  onRestartButler = async () => {
    const { dispatch } = this.props;
    const chromeStore = (await import("renderer/store")).default;
    const butlerState = chromeStore.getState().broth.packages["butler"];
    dispatch(
      actions.packageGotVersionPrefix({
        name: "butler",
        version: butlerState.version,
        versionPrefix: butlerState.versionPrefix,
      })
    );
    dispatch(actions.closeModal({ wind: "root" }));
    dispatch(actions.statusMessage({ message: "Butler restarted!" }));
  };

  toggleReduxLogging = () => {
    const enabled = !this.props.status.reduxLoggingEnabled;
    const { dispatch } = this.props;
    dispatch(
      actions.setReduxLoggingEnabled({
        enabled,
      })
    );

    if (enabled) {
      dispatch(actions.openDevTools({ wind: "root" }));
    }
  };
}

interface Props
  extends ModalWidgetProps<SecretSettingsParams, SecretSettingsResponse> {
  params: SecretSettingsParams;
  dispatch: Dispatch;

  status: RootState["status"];
}

export default hook((map) => ({
  status: map((rs) => rs.status),
}))(SecretSettings);
