import {
  connect,
  Dispatchers,
  actionCreatorsList,
} from "renderer/hocs/connect";
import React from "react";
import { IRootState } from "common/types";
import { createStructuredSelector } from "reselect";
import Icon from "renderer/basics/Icon";
import { T } from "renderer/t";
import BrothComponent from "renderer/pages/PreferencesPage/BrothComponent";

class BrothComponents extends React.Component<DerivedProps> {
  render() {
    const { packageNames } = this.props;

    return (
      <div className="section">
        <Icon icon="list" /> {T(["preferences.advanced.components"])}
        <span
          className="button"
          onClick={() => {
            this.props.checkForComponentUpdates({});
          }}
          style={{
            marginLeft: "10px",
            borderBottom: "1px solid",
          }}
        >
          {T(["menu.help.check_for_update"])}
        </span>
        {packageNames.map(name => <BrothComponent name={name} />)}
      </div>
    );
  }
}

const actionCreators = actionCreatorsList("checkForComponentUpdates");
type DerivedProps = Dispatchers<typeof actionCreators> & {
  packageNames: string[];
};

export default connect(
  BrothComponents,
  {
    state: createStructuredSelector({
      packageNames: (rs: IRootState) => rs.broth.packageNames,
    }),
    actionCreators,
  }
);
