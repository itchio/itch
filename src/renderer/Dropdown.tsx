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
import { buttonBorderRadius } from "renderer/theme";

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
}

export const DropdownItem = styled.div`
  display: flex;
  align-items: center;

  > .spacer {
    min-width: 10px;
    flex-shrink: 0;
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
        <MenuContents ref={coref("menu-contents")}>
          {props.options.map(({ value, label }) => {
            return (
              <Button
                key={`${value}`}
                onClick={() => {
                  props.onChange(value);
                  setOpen(false);
                }}
                label={
                  <DropdownItem>
                    <Icon
                      icon={
                        props.value === value
                          ? "radio-checked"
                          : "radio-unchecked"
                      }
                    />
                    <div className="spacer" />
                    {message(label)}
                  </DropdownItem>
                }
              />
            );
          })}
        </MenuContents>
      }
    >
      <DropdownButton
        className={classNames(
          props.groupPosition ? `group-${props.groupPosition}` : null
        )}
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
