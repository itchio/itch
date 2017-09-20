import styled from "./styles";

export const filtersContainerHeight = 40;

export const FiltersContainer = styled.section`
  display: flex;
  align-items: center;
  width: 100%;
  background: ${props => props.theme.breadBackground};
  box-shadow: 0 4px 8px -4px ${props => props.theme.breadBackground};
  flex-shrink: 0;
  padding-left: 10px;
  padding-right: 4px;
  min-height: ${filtersContainerHeight}px;
`;
