import { actions } from "common/actions";
import { Dispatch, PreferencesState } from "common/types";
import React from "react";
import { hookWithProps } from "renderer/hocs/hook";
import Label from "renderer/pages/PreferencesPage/Label";

class Checkbox extends React.PureComponent<Props> {
  override render() {
    const { active, children, label } = this.props;
    // an unset optional preference used to render an uncontrolled
    // checkbox (checked={undefined}); treat it as unchecked instead
    const checked = !!active;

    return (
      <Label active={checked}>
        <input type="checkbox" checked={checked} onChange={this.onChange} />
        <span> {label} </span>
        {children}
      </Label>
    );
  }

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, dispatch, onChange } = this.props;
    if (onChange) {
      onChange(e);
    } else {
      dispatch(actions.updatePreferences({ [name]: e.currentTarget.checked }));
    }
  };
}

/** preference keys that hold booleans, the only ones a checkbox can edit */
type BooleanPreferenceKey = {
  [K in keyof PreferencesState]-?: NonNullable<
    PreferencesState[K]
  > extends boolean
    ? K
    : never;
}[keyof PreferencesState];

interface Props {
  name: BooleanPreferenceKey;
  label: string | JSX.Element;
  children?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

  dispatch: Dispatch;
  /** undefined when an optional boolean preference is unset */
  active: boolean | undefined;
}

export default hookWithProps(Checkbox)((map) => ({
  active: map((rs, props) => rs.preferences[props.name]),
}))(Checkbox);
