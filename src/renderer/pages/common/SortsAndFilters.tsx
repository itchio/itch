import { FiltersContainerDiv } from "renderer/basics/FiltersContainer";
import Icon from "renderer/basics/Icon";
import styled, { css } from "renderer/styles";

export const SortsAndFilters = styled(FiltersContainerDiv)`
  display: flex;
  justify-content: center;
  flex-flow: row wrap;
  height: auto;

  padding: 0.4em 0.6em;
  font-weight: normal;
`;

export const FilterGroup = styled.div`
  margin: 0.5em 0;
  display: flex;
  flex-flow: row wrap;
`;

// const inactiveBg = `linear-gradient(to top,hsla(355, 43%, 25%, 1),hsla(355, 43%, 17%, 1))`;
// const activeBg = `linear-gradient(to top, hsla(355, 43%, 50%, 1), hsla(355, 43%, 37%, 1));`;
const inactiveBg = `linear-gradient(to top, hsla(355, 48%, 38%, 1), hsla(355, 48%, 27%, 1));`;
const activeBg = `linear-gradient(to top, hsla(355, 43%, 33%, 1), hsla(355, 43%, 22%, 1));`;
/*
const inactiveBg = global.ReduxStore.getState().preferences.lightMode
  ? `linear-gradient(to top, hsla(355, 48%, 38%, 1), hsla(355, 48%, 27%, 1));`
  : `linear-gradient(to top,hsla(355, 43%, 17%, 1),hsla(355, 43%, 11%, 1))`;
const activeBg = global.ReduxStore.getState().preferences.lightMode
  ? `linear-gradient(to top, hsla(355, 43%, 33%, 1), hsla(355, 43%, 22%, 1));`
  : `linear-gradient(to top, hsla(355, 43%, 33%, 1), hsla(355, 43%, 22%, 1));`;
  */
const borderColor = `#843442`;
const borderRadius = `4px`;

//color: ${(props) => props.theme.baseText};

const optionButtonLike = css`
  display: flex;
  flex-flow: row;
  align-items: center;

  background: ${inactiveBg};
  padding: 0.5em 1em;
  margin: 0;
  border: 1px solid ${borderColor};
  border-left: none;
  color: #fffff0;
  transition: all 0.4s;

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
    color: #fffff0;
  }

  &:hover {
    cursor: pointer;
  }
`;

export const FilterOptionLink = styled.a`
  ${optionButtonLike};

  &.disabled {
    pointer-events: none;
    opacity: 0.4;
  }
`;

export const FilterOptionButton = styled.div`
  ${optionButtonLike};
`;

export const FilterOptionIcon = styled(Icon)`
  margin-right: 0.5em;
  font-size: 80%;

  opacity: 1;
  &.inactive {
    opacity: 0.2;
  }
`;

export const FilterSpacer = styled.div`
  width: 24px;
  flex-shrink: 0;
`;
