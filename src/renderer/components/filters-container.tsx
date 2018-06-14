import styled, * as styles from "./styles";
import React from "react";
import classNames from "classnames";
import BrowserControls from "./browser-controls";

export const filtersContainerHeight = 40;

export const FiltersContainerDiv = styled.section`
  display: flex;
  align-items: center;
  width: 100%;
  background: ${props => props.theme.breadBackground};
  box-shadow: 0 4px 8px -4px ${props => props.theme.breadBackground};
  flex-shrink: 0;
  padding-left: 10px;
  padding-right: 10px;
  height: ${filtersContainerHeight}px;

  border-width: 0;
  border-bottom-width: 1px;
  border-image-source: repeating-linear-gradient(
    to right,
    #353535 0,
    #353535 95%,
    transparent 95%,
    transparent 100%
  );

  &.loading {
    border-image-source: repeating-linear-gradient(
      to right,
      ${props => props.theme.lightAccent} 0,
      ${props => props.theme.lightAccent} 95%,
      transparent 95%,
      transparent 100%
    );
    animation: ${styles.animations.loadBorder} 10s cubic-bezier(0, 0, 0, 0.42)
      infinite;
  }

  border-image-slice: 100% 10% 0% 0%;
  border-bottom: 4px solid;
`;

class FiltersContainer extends React.PureComponent<IProps> {
  render() {
    const { loading, children, className } = this.props;
    return (
      <FiltersContainerDiv className={classNames(className, { loading })}>
        <BrowserControls loading={loading} showAddressBar />
        {children}
      </FiltersContainerDiv>
    );
  }
}

interface IProps {
  loading: boolean;

  children?: JSX.Element | JSX.Element[];
  className?: string;
}

export default FiltersContainer;
