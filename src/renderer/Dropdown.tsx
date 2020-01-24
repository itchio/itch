import { LocalizedString } from "common/types";
import _ from "lodash";
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Button } from "renderer/basics/Button";
import { Icon } from "renderer/basics/Icon";
import { MenuContents, MenuTippy } from "renderer/basics/Menu";
import { useClickOutside } from "renderer/basics/useClickOutside";
import styled from "styled-components";
import classNames from "classnames";
import { buttonBorderRadius, mixins } from "renderer/theme";

const DropdownContents = styled(MenuContents)`
  max-height: 400px;
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
  label: React.ReactNode;
  value: T;
}

export interface Props<T> {
  groupPosition?: "start" | "middle" | "end";
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  onChange: (value: T) => void;
  value: T;
  renderValue?: (value: T) => React.ReactNode;
  options: readonly Option<T>[];
  name?: string;
  className?: string;
  width?: number;
}

export const DropdownItem = styled.div`
  display: flex;
  align-items: center;

  > .spacer {
    flex-basis: 10px;
    flex-shrink: 0;
  }

  > .icon {
    flex-shrink: 0;

    &.hidden {
      visibility: hidden;
    }
  }

  > .filler {
    flex-basis: 10px;
    flex-shrink: 0;
    flex-grow: 1;
  }

  > .label {
    flex-grow: 1;
  }
`;

export const Dropdown = function<T>(props: Props<T>) {
  let activeOption = _.find(props.options, o => o.value == props.value);
  if (!activeOption) {
    activeOption = props.options[0];
  }
  const [open, setOpen] = useState(false);
  const coref = useClickOutside(() => setOpen(false));

  let currentRef = useRef<HTMLButtonElement | null>(null);
  useLayoutEffect(() => {
    console.log(`currentRef.current = `, currentRef.current);
    currentRef.current?.scrollIntoView({
      behavior: "auto",
      block: "center",
    });
  });

  return (
    <MenuTippy
      visible={open}
      interactive
      placement="bottom"
      appendTo={document.body}
      boundary="viewport"
      animateFill
      maxWidth={props.width}
      content={
        <DropdownContents
          style={{ width: props.width ?? 180 }}
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
                ref={open && props.value === value ? currentRef : null}
                label={
                  <DropdownItem>
                    <span className="label">{label}</span>
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
        lefty
        className={classNames(
          "dropdown",
          props.className,
          props.groupPosition ? `group-${props.groupPosition}` : null
        )}
        style={{ width: props.width ?? "initial" }}
        data-name={props.name}
        secondary
        ref={coref("button")}
        onClick={() => setOpen(open => !open)}
        label={
          <DropdownItem>
            {props.prefix}
            {props.renderValue
              ? props.renderValue(props.value)
              : activeOption.label}
            {props.suffix}
          </DropdownItem>
        }
      />
    </MenuTippy>
  );
};
