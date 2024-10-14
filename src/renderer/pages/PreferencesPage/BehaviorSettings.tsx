import React from "react";

import Checkbox from "renderer/pages/PreferencesPage/Checkbox";
import OpenAtLoginErrorMessage from "renderer/pages/PreferencesPage/OpenAtLoginErrorMessage";
import { hook } from "renderer/hocs/hook";

import { T } from "renderer/t";
import urls from "common/constants/urls";

class BehaviorSettings extends React.PureComponent<Props> {
  render() {
    const { lightMode } = this.props;

    return (
      <>
        <h2>{T(["preferences.security"])}</h2>
        <div className="security-form">
          <Checkbox
            name="isolateApps"
            label={T(["preferences.security.sandbox.title"])}
          />
        </div>

        {lightMode ? (
          <p className="explanation" style={{ color: "#2d2d2d" }}>
            {T(["preferences.security.sandbox.description"])}{" "}
            <a href={urls.sandboxDocs} style={{ color: "#707070" }}>
              {T(["docs.learn_more"])}
            </a>
          </p>
        ) : (
          <p className="explanation">
            {T(["preferences.security.sandbox.description"])}{" "}
            <a href={urls.sandboxDocs}>{T(["docs.learn_more"])}</a>
          </p>
        )}

        <h2>{T(["preferences.behavior"])}</h2>
        <div className="behavior-form">
          <Checkbox
            name="lightMode"
            label={T(["preferences.behavior.lightMode"])}
          />

          <Checkbox
            name="enableTabs"
            label={T(["preferences.behavior.enable_tabs"])}
          />

          <Checkbox
            name="openAtLogin"
            label={T(["preferences.behavior.open_at_login"])}
          />

          <OpenAtLoginErrorMessage />

          <Checkbox
            name="openAsHidden"
            label={T(["preferences.behavior.open_as_hidden"])}
          />

          <Checkbox
            name="closeToTray"
            label={T(["preferences.behavior.close_to_tray"])}
          />

          <Checkbox
            name="manualGameUpdates"
            label={T(["preferences.behavior.manual_game_updates"])}
          />

          <Checkbox
            name="preventDisplaySleep"
            label={T(["preferences.behavior.prevent_display_sleep"])}
          />
        </div>

        <h2>{T(["preferences.notifications"])}</h2>
        <div className="behavior-form">
          <Checkbox
            name="readyNotification"
            label={T(["preferences.notifications.ready_notification"])}
          />
        </div>
      </>
    );
  }
}

interface Props {
  lightMode: boolean;
}

export default hook((map) => ({
  lightMode: map((rs) => rs.preferences.lightMode),
}))(BehaviorSettings);
