import classNames from "classnames";
import React from "react";
import NavigationBar from "renderer/basics/NavigationBar";
import styled from "renderer/styles";

export const filtersContainerHeight = 40;

export const FiltersContainerDiv = styled.section`
  display: flex;
  align-items: center;
  padding-bottom: 2px;
  width: 100%;
  background: ${props => props.theme.sidebarBackground};
  box-shadow: 0 4px 8px -4px ${props => props.theme.sidebarBackground};
  flex-shrink: 0;
  padding-left: 10px;
  padding-right: 10px;
  height: ${filtersContainerHeight}px;
`;

class FiltersContainer extends React.PureComponent<Props> {
  render() {
    const { loading, children, className } = this.props;
    return (
      <FiltersContainerDiv className={classNames(className, { loading })}>
        <NavigationBar
          loading={loading}
          showAddressBar={!this.props.hideAddressBar}
        />
        {children}
      </FiltersContainerDiv>
    );
  }
}

interface Props {
  loading: boolean;

  children?: JSX.Element | JSX.Element[];
  className?: string;
  hideAddressBar?: boolean;
}

export default FiltersContainer;
