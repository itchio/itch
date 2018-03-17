import * as React from "react";

import Checkbox from "./checkbox";
import OpenAtLoginError from "./open-at-login-error";
import ExperimentalMark from "./experimental-mark";

import format from "../format";
import urls from "../../constants/urls";

export default class BehaviorSettings extends React.PureComponent<IProps> {
  render() {
    return (
      <>
        <h2>{format(["preferences.security"])}</h2>
        <div className="security-form">
          <Checkbox
            name="isolateApps"
            label={format(["preferences.security.sandbox.title"])}
          >
            <ExperimentalMark />
          </Checkbox>
        </div>

        <p className="explanation">
          {format(["preferences.security.sandbox.description"])}{" "}
          <a href={urls.sandboxDocs}>{format(["docs.learn_more"])}</a>
        </p>

        <h2>{format(["preferences.behavior"])}</h2>
        <div className="behavior-form">
          <Checkbox
            name="openAtLogin"
            label={format(["preferences.behavior.open_at_login"])}
          />

          <OpenAtLoginError />

          <Checkbox
            name="openAsHidden"
            label={format(["preferences.behavior.open_as_hidden"])}
          />

          <Checkbox
            name="closeToTray"
            label={format(["preferences.behavior.close_to_tray"])}
          />

          <Checkbox
            name="manualGameUpdates"
            label={format(["preferences.behavior.manual_game_updates"])}
          />

          <Checkbox
            name="preventDisplaySleep"
            label={format(["preferences.behavior.prevent_display_sleep"])}
          />
        </div>

        <h2>{format(["preferences.notifications"])}</h2>
        <div className="behavior-form">
          <Checkbox
            name="readyNotification"
            label={format(["preferences.notifications.ready_notification"])}
          />
        </div>
      </>
    );
  }
}

interface IProps {}
