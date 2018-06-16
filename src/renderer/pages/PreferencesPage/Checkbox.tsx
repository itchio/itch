import React from "react";
import { IPreferencesState, IRootState } from "common/types";

import Label from "./Label";
import {
  connect,
  Dispatchers,
  actionCreatorsList,
} from "renderer/hocs/connect";

class Checkbox extends React.PureComponent<Props & DerivedProps> {
  render() {
    const { name, active, children, updatePreferences, label } = this.props;

    return (
      <Label active={active}>
        <input
          type="checkbox"
          checked={active}
          onChange={e => {
            updatePreferences({ [name]: e.currentTarget.checked });
          }}
        />
        <span> {label} </span>
        {children}
      </Label>
    );
  }
}

interface Props {
  name: keyof IPreferencesState;
  label: string | JSX.Element;
  children?: any;
}

const actionCreators = actionCreatorsList("updatePreferences");

type DerivedProps = Dispatchers<typeof actionCreators> & {
  active?: boolean;
};

export default connect<Props>(
  Checkbox,
  {
    state: (rs: IRootState, props: Props) => ({
      active: rs.preferences[props.name],
    }),
    actionCreators,
  }
);
