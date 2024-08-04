import { actions } from "common/actions";
import { Dispatch } from "common/types";
import React from "react";
import Icon from "renderer/basics/Icon";
import { hook } from "renderer/hocs/hook";
import BrothComponent from "renderer/pages/PreferencesPage/BrothComponent";
import { T } from "renderer/t";

class BrothComponents extends React.Component<Props> {
  render() {
    const { packageNames, lightMode } = this.props;

    return (
      <div className="section">
        <Icon icon="list" /> {T(["preferences.advanced.components"])}
        {lightMode ? (
          <span
            className="button"
            onClick={this.checkForUpdates}
            style={{
              marginLeft: "10px",
              borderBottom: "1px solid",
              color: "#707070",
            }}
          >
            {T(["menu.help.check_for_update"])}
          </span>
        ) : (
          <span
            className="button"
            onClick={this.checkForUpdates}
            style={{
              marginLeft: "10px",
              borderBottom: "1px solid",
              color: "#ececec",
            }}
          >
            {T(["menu.help.check_for_update"])}
          </span>
        )}
        {packageNames.map((name) => (
          <BrothComponent name={name} />
        ))}
      </div>
    );
  }

  checkForUpdates = () => {
    const { dispatch } = this.props;
    dispatch(actions.checkForComponentUpdates({}));
  };
}

interface Props {
  dispatch: Dispatch;

  packageNames: string[];
  lightMode: boolean;
}

export default hook((map) => ({
  packageNames: map((rs) => rs.broth.packageNames),
  lightMode: map((rs) => rs.preferences.lightMode),
}))(BrothComponents);
