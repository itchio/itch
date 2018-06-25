import classNames from "classnames";
import React from "react";
import styled from "renderer/styles";
import Icon from "renderer/basics/Icon";
import { FiltersContainerDiv } from "renderer/basics/FiltersContainer";
import { LocalizedString } from "common/types";
import { T } from "renderer/t";
import { Space } from "common/helpers/space";
import { withSpace } from "renderer/hocs/withSpace";

export const SortsAndFilters = styled(FiltersContainerDiv)`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  height: auto;

  padding: 0.4em 0.6em;
  font-weight: normal;
`;

export const SortGroup = styled.div`
  margin: 0.5em 0;
`;

const inactiveBg = `linear-gradient(to top,hsla(355, 43%, 25%, 1),hsla(355, 43%, 17%, 1))`;
const activeBg = `linear-gradient(to top, hsla(355, 43%, 50%, 1), hsla(355, 43%, 37%, 1));`;
const borderColor = `#843442`;
const borderRadius = `4px`;

export const SortOptionLink = styled.a`
  display: inline-block;
  background: ${inactiveBg};
  padding: 0.5em 1em;
  margin: 0;
  border: 1px solid ${borderColor};
  border-left: none;

  &:first-child {
    border-radius: ${borderRadius} 0 0 ${borderRadius};
    border-left: 1px solid ${borderColor};
  }

  &:last-child {
    border-radius: 0 ${borderRadius} ${borderRadius} 0;
  }

  &:first-child:last-child {
    border-radius: ${borderRadius};
  }

  &.active {
    background: ${activeBg};
    color: ${props => props.theme.baseText};
  }
`;

export const SortOptionIcon = styled(Icon)`
  margin-right: 0.5em;
  font-size: 80%;
`;

interface SortOptionProps {
  space: Space;
  icon: string;
  optionKey: string;
  optionValue: string;
  label: LocalizedString;
}

export const SortOption = withSpace((props: SortOptionProps) => {
  const { space, icon, optionKey, optionValue, label } = props;
  const href = space.urlWithParams({ [optionKey]: optionValue });
  const active = isSortActive(optionValue, space.queryParam(optionKey));
  return (
    <SortOptionLink
      target="_replace"
      href={href}
      className={classNames({ active })}
    >
      <SortOptionIcon icon={icon} />
      {T(label)}
    </SortOptionLink>
  );
});

export const SortSpacer = styled.div`
  width: 24px;
`;

function isSortActive(expected: string, actual: string): boolean {
  return expected === actual;
}
