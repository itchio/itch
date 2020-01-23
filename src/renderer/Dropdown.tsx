import { LocalizedString } from "common/types";
import _ from "lodash";
import React, { useState } from "react";
import { Button } from "renderer/basics/Button";
import { Icon } from "renderer/basics/Icon";
import { MenuContents, MenuTippy } from "renderer/basics/Menu";
import { message } from "renderer/basics/Message";
import { useClickOutside } from "renderer/basics/useClickOutside";
import styled from "styled-components";
import classNames from "classnames";
import { buttonBorderRadius, mixins } from "renderer/theme";

const DropdownContents = styled(MenuContents)`
  max-height: 80vh;
  overflow-y: auto;
`;

export const DropdownButton = styled(Button)`
  padding: 0 12px;
  min-width: initial;

  &.group-start {
    border-radius: ${buttonBorderRadius}px 0 0 ${buttonBorderRadius}px;
  }

  &.group-middle {
    border-radius: 0;
  }

  &.group-start,
  &.group-middle {
    border-right: none;
  }

  &.group-end {
    border-radius: 0 ${buttonBorderRadius}px ${buttonBorderRadius}px 0;
  }
`;

export interface Option<T> {
  label: LocalizedString;
  value: T;
}

export interface Props<T> {
  groupPosition?: "start" | "middle" | "end";
  prefix?: React.ReactNode;
  onChange: (value: T) => void;
  value: T;
  renderValue?: (value: T) => React.ReactNode;
  options: readonly Option<T>[];
  name?: string;
}

export const DropdownItem = styled.div`
  display: flex;
  align-items: center;

  > .spacer {
    flex-basis: 10px;
    flex-shrink: 0;
  }

  > .icon.hidden {
    visibility: hidden;
  }

  > .filler {
    flex-basis: 10px;
    flex-shrink: 0;
    flex-grow: 1;
  }

  > .label {
    ${mixins.singleLine};
  }
`;

export const Dropdown = function<T>(props: Props<T>) {
  let activeOption = _.find(props.options, o => o.value == props.value);
  if (!activeOption) {
    return <div>Option not found {props.value}</div>;
  }
  const [open, setOpen] = useState(false);
  const coref = useClickOutside(() => setOpen(false));

  return (
    <MenuTippy
      visible={open}
      interactive
      placement="bottom-end"
      appendTo={document.body}
      boundary="viewport"
      content={
        <DropdownContents
          className={"dropdown-options"}
          data-name={props.name}
          ref={coref("menu-contents")}
        >
          {props.options.map(({ value, label }) => {
            return (
              <Button
                key={`${value}`}
                className={"dropdown-option"}
                data-value={`${value}`}
                onClick={() => {
                  props.onChange(value);
                  setOpen(false);
                }}
                label={
                  <DropdownItem>
                    <span className="label">{message(label)}</span>
                    <div className="filler" />
                    <Icon
                      className={classNames({ hidden: props.value !== value })}
                      icon={"checkmark"}
                    />
                  </DropdownItem>
                }
              />
            );
          })}
        </DropdownContents>
      }
    >
      <DropdownButton
        className={classNames(
          "dropdown",
          props.groupPosition ? `group-${props.groupPosition}` : null
        )}
        data-name={props.name}
        secondary
        ref={coref("button")}
        onClick={() => setOpen(open => !open)}
        label={
          <DropdownItem>
            {props.prefix}
            {props.renderValue
              ? props.renderValue(props.value)
              : message(activeOption.label)}
          </DropdownItem>
        }
      />
    </MenuTippy>
  );
};
