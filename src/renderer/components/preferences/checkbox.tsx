import React from "react";
import { IPreferencesState, IRootState } from "common/types";

import Label from "./label";
import { connect, Dispatchers, actionCreatorsList } from "../connect";

class Checkbox extends React.PureComponent<IProps & IDerivedProps> {
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

interface IProps {
  name: keyof IPreferencesState;
  label: string | JSX.Element;
  children?: any;
}

const actionCreators = actionCreatorsList("updatePreferences");

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  active?: boolean;
};

export default connect<IProps>(Checkbox, {
  state: (rs: IRootState, props: IProps) => ({
    active: rs.preferences[props.name],
  }),
  actionCreators,
});
