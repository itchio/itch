import React from "react";
import { T } from "renderer/t";
import Icon from "renderer/basics/Icon";
import Checkbox from "./Checkbox";
import ProxySettings from "./ProxySettings";
import { formatArch, formatPlatform } from "common/format/platform";
import {
  actionCreatorsList,
  Dispatchers,
  connect,
} from "renderer/hocs/connect";
import { createStructuredSelector } from "reselect";
import { IRootState, ISystemState } from "common/types";
import BrothComponents from "./BrothComponents";
import { rendererWindow } from "common/util/navigation";

class AdvancedSettings extends React.PureComponent<Props & DerivedProps> {
  render() {
    const {
      system,
      clearBrowsingDataRequest,
      navigate,
      checkForGameUpdates,
    } = this.props;

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
                navigate({ window: "root", url: "itch://applog" });
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
                checkForGameUpdates({});
                navigate({ window: "root", url: "itch://downloads" });
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
                clearBrowsingDataRequest({
                  window: rendererWindow(),
                });
              }}
            >
              {T(["preferences.advanced.clear_browsing_data"])}
            </span>
          </div>
          <Checkbox
            name="preferOptimizedPatches"
            label={T(["preferences.advanced.prefer_optimized_patches"])}
          />
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

interface Props {}

const actionCreators = actionCreatorsList(
  "checkForComponentUpdates",
  "clearBrowsingDataRequest",
  "navigate",
  "checkForGameUpdates"
);

type DerivedProps = Dispatchers<typeof actionCreators> & {
  system: ISystemState;
};

export default connect<Props>(
  AdvancedSettings,
  {
    actionCreators,
    state: createStructuredSelector({
      system: (rs: IRootState) => rs.system,
    }),
  }
);
