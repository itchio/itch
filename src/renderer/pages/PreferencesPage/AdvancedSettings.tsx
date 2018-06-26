import { actions } from "common/actions";
import { formatArch, formatPlatform } from "common/format/platform";
import { Dispatch, RootState, SystemState } from "common/types";
import { rendererWindow } from "common/util/navigation";
import React from "react";
import Icon from "renderer/basics/Icon";
import { connect } from "renderer/hocs/connect";
import { withDispatch } from "renderer/hocs/withDispatch";
import { T } from "renderer/t";
import { createStructuredSelector } from "reselect";
import BrothComponents from "./BrothComponents";
import Checkbox from "./Checkbox";
import ProxySettings from "./ProxySettings";

class AdvancedSettings extends React.PureComponent<Props & DerivedProps> {
  render() {
    const { system, dispatch } = this.props;

    return (
      <>
        <h2 id="preferences-advanced-section">{T(["preferences.advanced"])}</h2>
        <div className="explanation advanced-form">
          <BrothComponents />
          <div className="section">
            <Icon icon="security" /> {formatPlatform(system.platform)}{" "}
            {formatArch(system.arch)}
          </div>
          <p>
            <ProxySettings />
          </p>
          <div className="section">
            <span
              className="link"
              onClick={e => {
                e.preventDefault();
                dispatch(
                  actions.navigate({ window: "root", url: "itch://applog" })
                );
              }}
            >
              {T(["preferences.advanced.open_app_log"])}
            </span>
          </div>
          <div className="section">
            <span
              className="link"
              onClick={e => {
                e.preventDefault();
                dispatch(actions.checkForGameUpdates({}));
                dispatch(
                  actions.navigate({ window: "root", url: "itch://downloads" })
                );
              }}
            >
              {T(["preferences.advanced.check_game_updates"])}
            </span>
          </div>
          <div className="section">
            <span
              id="clear-browsing-data-link"
              className="link"
              onClick={e => {
                e.preventDefault();
                dispatch(
                  actions.clearBrowsingDataRequest({
                    window: rendererWindow(),
                  })
                );
              }}
            >
              {T(["preferences.advanced.clear_browsing_data"])}
            </span>
          </div>
          <Checkbox
            name="disableBrowser"
            label={T(["preferences.advanced.disable_browser"])}
          />
          <Checkbox
            name="disableHardwareAcceleration"
            label={T(["preferences.advanced.disable_hardware_acceleration"])}
          />
        </div>
      </>
    );
  }
}

interface Props {
  dispatch: Dispatch;
}

interface DerivedProps {
  system: SystemState;
}

export default withDispatch(
  connect<Props>(
    AdvancedSettings,
    {
      state: createStructuredSelector({
        system: (rs: RootState) => rs.system,
      }),
    }
  )
);
