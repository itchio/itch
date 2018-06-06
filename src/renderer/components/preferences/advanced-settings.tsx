import React from "react";
import { T } from "renderer/t";
import Icon from "renderer/components/basics/icon";
import Checkbox from "./checkbox";
import ProxySettings from "./proxy-settings";
import { formatArch, formatPlatform } from "common/format/platform";
import {
  actionCreatorsList,
  Dispatchers,
  connect,
} from "renderer/components/connect";
import { createStructuredSelector } from "reselect";
import { IRootState, ISystemState } from "common/types";
import BrothComponents from "./broth-components";

class AdvancedSettings extends React.PureComponent<IProps & IDerivedProps> {
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
          <p className="section">
            <Icon icon="security" /> {formatPlatform(system.platform)}{" "}
            {formatArch(system.arch)}
          </p>
          <p>
            <ProxySettings />
          </p>
          <p className="section">
            <span
              className="link"
              onClick={e => {
                e.preventDefault();
                navigate({ window: "root", url: "itch://applog" });
              }}
            >
              {T(["preferences.advanced.open_app_log"])}
            </span>
          </p>
          <p className="section">
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
          </p>
          <p className="section">
            <span
              id="clear-browsing-data-link"
              className="link"
              onClick={e => {
                e.preventDefault();
                clearBrowsingDataRequest({});
              }}
            >
              {T(["preferences.advanced.clear_browsing_data"])}
            </span>
          </p>
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

interface IProps {}

const actionCreators = actionCreatorsList(
  "checkForComponentUpdates",
  "clearBrowsingDataRequest",
  "navigate",
  "checkForGameUpdates"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  system: ISystemState;
};

export default connect<IProps>(AdvancedSettings, {
  actionCreators,
  state: createStructuredSelector({
    system: (rs: IRootState) => rs.system,
  }),
});
