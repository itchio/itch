import React from "react";
import { PreferencesState, RootState, Dispatch } from "common/types";

import Label from "./Label";
import { withDispatch } from "renderer/hocs/withDispatch";
import { actions } from "common/actions";
import { connect } from "renderer/hocs/connect";

class Checkbox extends React.PureComponent<Props & DerivedProps> {
  render() {
    const { name, active, children, dispatch, label } = this.props;

    return (
      <Label active={active}>
        <input
          type="checkbox"
          checked={active}
          onChange={e => {
            dispatch(
              actions.updatePreferences({ [name]: e.currentTarget.checked })
            );
          }}
        />
        <span> {label} </span>
        {children}
      </Label>
    );
  }
}

interface Props {
  name: keyof PreferencesState;
  label: string | JSX.Element;
  children?: any;

  dispatch: Dispatch;
}

interface DerivedProps {
  active?: boolean;
}

export default withDispatch(
  connect<Props>(
    Checkbox,
    {
      state: (rs: RootState, props: Props) => ({
        active: rs.preferences[props.name],
      }),
    }
  )
);
