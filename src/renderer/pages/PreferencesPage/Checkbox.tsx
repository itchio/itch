import { actions } from "common/actions";
import { PreferencesState } from "common/types";
import React from "react";
import Checkbox from "renderer/basics/Checkbox";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import Label from "renderer/pages/PreferencesPage/Label";

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
  children?: React.ReactNode;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PreferencesCheckbox = ({ name, label, children, onChange }: Props) => {
  const dispatch = useAppDispatch();
  // undefined when an optional boolean preference is unset
  const checked = !!useAppSelector((rs) => rs.preferences[name]);

  const onCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e);
    } else {
      dispatch(actions.updatePreferences({ [name]: e.currentTarget.checked }));
    }
  };

  return (
    <Label active={checked}>
      <Checkbox checked={checked} onChange={onCheckboxChange} />
      <span> {label} </span>
      {children}
    </Label>
  );
};

export default PreferencesCheckbox;
