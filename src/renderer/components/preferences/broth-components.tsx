import {
  connect,
  Dispatchers,
  actionCreatorsList,
} from "renderer/components/connect";
import React from "react";
import { IRootState } from "common/types";
import { createStructuredSelector } from "reselect";
import Icon from "../basics/icon";
import BrothComponent from "./broth-component";
import { T } from "renderer/t";

class BrothComponents extends React.Component<IDerivedProps> {
  render() {
    const { packageNames } = this.props;

    return (
      <p className="section">
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
      </p>
    );
  }
}

const actionCreators = actionCreatorsList("checkForComponentUpdates");
type IDerivedProps = Dispatchers<typeof actionCreators> & {
  packageNames: string[];
};

export default connect(BrothComponents, {
  state: createStructuredSelector({
    packageNames: (rs: IRootState) => rs.broth.packageNames,
  }),
  actionCreators,
});
