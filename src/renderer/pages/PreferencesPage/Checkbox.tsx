import { actions } from "common/actions";
import { Dispatch, PreferencesState } from "common/types";
import React from "react";
import { hookWithProps } from "renderer/hocs/hook";
import Label from "renderer/pages/PreferencesPage/Label";

class Checkbox extends React.PureComponent<Props> {
  render() {
    const { active, children, label } = this.props;

    return (
      <Label active={active}>
        <input type="checkbox" checked={active} onChange={this.onChange} />
        <span> {label} </span>
        {children}
      </Label>
    );
  }

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, dispatch } = this.props;
    dispatch(actions.updatePreferences({ [name]: e.currentTarget.checked }));
  };
}

interface Props {
  name: keyof PreferencesState;
  label: string | JSX.Element;
  children?: any;

  dispatch: Dispatch;
  active: boolean;
}

export default hookWithProps(Checkbox)((map) => ({
  active: map((rs, props) => rs.preferences[props.name]),
}))(Checkbox);
