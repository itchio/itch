import _ from "lodash";
import React, { useState } from "react";
import { LocalizedString } from "common/types";
import { useClickOutside } from "renderer/basics/useClickOutside";
import { DropdownButton, DropdownItem } from "renderer/Dropdown";
import { MenuTippy, MenuContents } from "renderer/basics/Menu";
import { Button } from "renderer/basics/Button";
import { message } from "renderer/basics/Message";
import { Icon } from "renderer/basics/Icon";

export interface Option<T> {
  label: LocalizedString;
  value: T;
}

export interface Props<T> {
  prefix?: React.ReactNode;
  empty?: React.ReactNode;
  onChange: (values: T[]) => void;
  values: T[];
  options: readonly Option<T>[];
}

export const MultiDropdown = function<T>(props: Props<T>) {
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
          <Button
            disabled={_.isEmpty(props.values)}
            onClick={() => {
              props.onChange([]);
              setOpen(false);
            }}
            label={<DropdownItem>Clear filters</DropdownItem>}
          />
          {props.options.map(({ value, label }) => {
            return (
              <Button
                onClick={() => {
                  if (_.includes(props.values, value)) {
                    props.onChange(_.filter(props.values, v => v !== value));
                  } else {
                    props.onChange([...props.values, value]);
                  }
                  setOpen(false);
                }}
                label={
                  <DropdownItem>
                    <Icon
                      icon={
                        _.includes(props.values, value)
                          ? "checked"
                          : "unchecked"
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
        secondary
        ref={coref("button")}
        onClick={() => setOpen(open => !open)}
        label={
          <DropdownItem>
            {props.prefix}
            {_.isEmpty(props.values)
              ? props.empty ?? "Empty"
              : props.values.map((v, i) => {
                  let opt = _.find(props.options, o => o.value === v);
                  return (
                    <>
                      {message(opt!.label)}
                      {i < props.values.length - 1 ? ", " : null}
                    </>
                  );
                })}
          </DropdownItem>
        }
      />
    </MenuTippy>
  );
};
