import { FiltersContainerDiv } from "renderer/basics/FiltersContainer";
import Icon from "renderer/basics/Icon";
import styled from "renderer/styles";

export const SortsAndFilters = styled(FiltersContainerDiv)`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  height: auto;

  padding: 0.4em 0.6em;
  font-weight: normal;
`;

export const FilterGroup = styled.div`
  margin: 0.5em 0;
`;

// const inactiveBg = `linear-gradient(to top,hsla(355, 43%, 25%, 1),hsla(355, 43%, 17%, 1))`;
// const activeBg = `linear-gradient(to top, hsla(355, 43%, 50%, 1), hsla(355, 43%, 37%, 1));`;
const inactiveBg = `linear-gradient(to top,hsla(355, 43%, 17%, 1),hsla(355, 43%, 11%, 1))`;
const activeBg = `linear-gradient(to top, hsla(355, 43%, 33%, 1), hsla(355, 43%, 22%, 1));`;
const borderColor = `#843442`;
const borderRadius = `4px`;

export const FilterOptionLink = styled.a`
  display: inline-block;
  background: ${inactiveBg};
  padding: 0.5em 1em;
  margin: 0;
  border: 1px solid ${borderColor};
  border-left: none;

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
    color: ${props => props.theme.baseText};
  }
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
