import React from "react";
import BaseSelect from "react-select";
import { Subtract } from "common/types";
import { StylesConfig } from "react-select/lib/styles";
import { theme } from "renderer/styles";

interface ImplicitProps {
  styles: StylesConfig;
}
type SelectProps<T> = BaseSelect<T>["props"];

type Props<T> = Subtract<SelectProps<T>, ImplicitProps>;

const customSelectStyles: StylesConfig = {
  menuList: (base, state) => ({
    ...base,
    backgroundColor: theme.inputBackground,
    borderColor: theme.inputBorder,
  }),
  container: (base, state) => ({
    ...base,
    flexGrow: 1,
  }),
  option: (base, state) => ({
    cursor: base.cursor,
    padding: base.padding,
    color: theme.inputText,
    backgroundColor: state.isSelected
      ? theme.inputSelectedBackground
      : state.isFocused
        ? theme.inputFocusedBackground
        : "transparent",
  }),
  control: (base, state) => {
    return {
      ...base,
      backgroundColor: theme.inputBackground,
      borderColor: theme.inputBorder,
      boxShadow: "none",
    };
  },
  singleValue: (base, state) => ({
    ...base,
    color: theme.inputText,
  }),
};

export function Select<T>(props: Props<T>) {
  return <BaseSelect {...props} styles={customSelectStyles} />;
}
