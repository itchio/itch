import { actions } from "common/actions";
import { Dispatch } from "common/types";
import React from "react";
import Icon from "renderer/basics/Icon";
import { hook } from "renderer/hocs/hook";
import BrothComponent from "renderer/pages/PreferencesPage/BrothComponent";
import { T } from "renderer/t";

class BrothComponents extends React.Component<Props> {
  render() {
    const { packageNames } = this.props;

    return (
      <div className="section">
        <Icon icon="list" /> {T(["preferences.advanced.components"])}
        <span
          className="button"
          onClick={this.checkForUpdates}
          style={{
            marginLeft: "10px",
            borderBottom: "1px solid",
          }}
        >
          {T(["menu.help.check_for_update"])}
        </span>
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
}

export default hook((map) => ({
  packageNames: map((rs) => rs.broth.packageNames),
}))(BrothComponents);
