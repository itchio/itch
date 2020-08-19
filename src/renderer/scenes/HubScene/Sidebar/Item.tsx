import React from "react";
import classNames from "classnames";

import { T } from "renderer/t";

import { LocalizedString, TabInstance } from "common/types";

import Filler from "renderer/basics/Filler";
import LoadingCircle from "renderer/basics/LoadingCircle";
import Icon from "renderer/basics/Icon";
import IconButton from "renderer/basics/IconButton";

import styled, * as styles from "renderer/styles";
import { darken } from "polished";
import { isSecretClick } from "common/helpers/secret-click";

const UnshrinkableIconButton = styled(IconButton)`
  flex-shrink: 0;
`;

const ItemHeading = styled.div`
  ${styles.singleLine};
  padding: 0.2em 0;
`;

const ItemSection = styled.section`
  background: ${(props) => props.theme.sidebarBackground};
  font-size: 14px;
  border-radius: 0 4px 4px 0;
  word-break: break-word;

  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  margin: 2px 0;
  margin-right: 0;
  padding-left: 8px;
  height: 32px;
  justify-content: center;

  position: relative;

  &.active {
    .icon-cross {
      opacity: 1;
      color: ${(props) => props.theme.secondaryText}

      &:hover {
        color: ${(props) => props.theme.secondaryTextHover}
      }
    }
    
    background: ${(props) => props.theme.sidebarEntryFocusedBackground}
  }

  &:hover {
    cursor: pointer;
    background: ${(props) =>
      darken(0.02, props.theme.sidebarEntryFocusedBackground)};
    color: ${(props) => props.theme.baseText};

    .icon-cross {
      opacity: 1;
    }
  }
`;

const Row = styled.div`
  display: flex;
  flex-shrink: 0;
  flex-direction: row;
  align-items: center;
`;

const IconContainer = styled.div`
  width: 18px;
  height: 16px;
  margin-right: 4px;
  text-align: center;
  flex-shrink: 0;

  img {
    width: 14px;
    height: 14px;
    margin-right: 2px;
    border-radius: 2px;
  }
`;

const ProgressOuter = styled.div`
  ${styles.progress};
  width: 60px;
  height: 4px;
  margin: 4px 0 2px 10px;

  &,
  .progress-inner {
    border-radius: 4px;
  }

  .progress-inner {
    background-color: white;
  }
`;

const Bubble = styled.span`
  font-size: 11px;
  background: white;
  border-radius: 2px;
  color: ${(props) => props.theme.sidebarBackground};
  font-weight: bold;
  padding: 1px 6px;
  margin-left: 8px;
  white-space: nowrap;
`;

class Item extends React.PureComponent<Props> {
  onClick = (e: React.MouseEvent<HTMLElement>) => {
    if (isSecretClick(e)) {
      const { onExplore, tab } = this.props;
      if (onExplore) {
        onExplore(tab);
        return;
      }
    }

    // left (normal) click
    const { onClick } = this.props;
    if (onClick) {
      onClick();
    }
  };

  onMouseUp = (e: React.MouseEvent<HTMLElement>) => {
    if (e.button === 1) {
      // middle click
      const { onClose } = this.props;
      if (onClose) {
        onClose();
      }
    }
  };

  onCloseClick = (e: React.MouseEvent<any>) => {
    e.stopPropagation();

    const { onClose } = this.props;
    if (onClose) {
      onClose();
    }
  };

  render() {
    const {
      count,
      sublabel,
      progress,
      tab,
      label,
      active,
      url,
      resource,
    } = this.props;
    const { onClose } = this.props;

    const progressColor = "white";
    const progressStyle = {
      width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
      backgroundColor: progressColor,
    };

    return (
      <ItemSection
        className={classNames({ active })}
        data-rh-at="right"
        data-rh={sublabel ? JSON.stringify(sublabel) : null}
        onClick={this.onClick}
        onMouseUp={this.onMouseUp}
        data-id={tab}
        data-url={url}
        data-resource={resource}
      >
        <Row>
          <IconContainer>
            {this.props.loading ? (
              <LoadingCircle progress={-1} />
            ) : this.props.iconImage ? (
              <img className="icon-image" src={this.props.iconImage} />
            ) : (
              <Icon icon={this.props.icon || "tag"} />
            )}
          </IconContainer>
          <ItemHeading>{T(label)}</ItemHeading>
          {count > 0 ? <Bubble>{count}</Bubble> : null}
          <Filler />
          {progress !== null ? (
            <ProgressOuter>
              <div className="progress-inner" style={progressStyle} />
            </ProgressOuter>
          ) : null}
          {onClose ? (
            <UnshrinkableIconButton icon="cross" onClick={this.onCloseClick} />
          ) : null}
        </Row>
      </ItemSection>
    );
  }
}

interface Props {
  tab: string;
  url: string;
  resource: string;
  label: LocalizedString;
  active: boolean;
  count?: number;
  sublabel?: LocalizedString;
  progress?: number;

  icon?: string;
  iconImage?: string;

  loading: boolean;

  onClick?: () => void;
  onClose?: () => void;
  onExplore?: (tabId: string) => void;
  tabInstance?: TabInstance;
}

export default Item;
