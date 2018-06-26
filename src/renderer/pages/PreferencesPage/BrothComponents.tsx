import { actions } from "common/actions";
import { Dispatch, RootState } from "common/types";
import React from "react";
import Icon from "renderer/basics/Icon";
import { connect } from "renderer/hocs/connect";
import { withDispatch } from "renderer/hocs/withDispatch";
import BrothComponent from "renderer/pages/PreferencesPage/BrothComponent";
import { T } from "renderer/t";
import { createStructuredSelector } from "reselect";

class BrothComponents extends React.Component<Props & DerivedProps> {
  render() {
    const { dispatch, packageNames } = this.props;

    return (
      <div className="section">
        <Icon icon="list" /> {T(["preferences.advanced.components"])}
        <span
          className="button"
          onClick={() => {
            dispatch(actions.checkForComponentUpdates({}));
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

interface Props {
  dispatch: Dispatch;
}

interface DerivedProps {
  packageNames: string[];
}

export default withDispatch(
  connect<Props>(
    BrothComponents,
    {
      state: createStructuredSelector({
        packageNames: (rs: RootState) => rs.broth.packageNames,
      }),
    }
  )
);
