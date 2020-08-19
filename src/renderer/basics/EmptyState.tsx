import { LocalizedString } from "common/types";
import React from "react";
import Button from "renderer/basics/Button";
import Icon from "renderer/basics/Icon";
import styled from "renderer/styles";
import { T } from "renderer/t";

const EmptyStateDiv = styled.div`
  color: ${(props) => props.theme.secondaryText};
  width: 100%;
  text-align: center;
  margin: 60px 0;

  .leader {
    display: inline-block;
    font-size: 170px;
    margin-bottom: 20px;
  }

  h1 {
    font-size: ${(props) => props.theme.fontSizes.enormous};
    font-weight: bold;
    margin-bottom: 10px;
  }

  h2 {
    font-size: ${(props) => props.theme.fontSizes.huge};
  }
`;

const ButtonContainer = styled.div`
  margin: 20px;
  display: inline-block;
`;

const EmptyStateContainer = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  overflow: hidden;
`;

class EmptyState extends React.PureComponent<Props> {
  render() {
    const {
      bigText,
      smallText,
      icon,
      buttonIcon,
      buttonText,
      buttonAction,
      componentAction,
      className,
    } = this.props;

    return (
      <EmptyStateContainer>
        <EmptyStateDiv className={className}>
          <Icon icon={icon} className="leader" />
          <h1>{T(bigText)}</h1>
          {smallText ? <h2>{T(smallText)}</h2> : null}
          {componentAction}
          {buttonAction ? (
            <>
              <ButtonContainer>
                <Button icon={buttonIcon} primary onClick={buttonAction}>
                  {T(buttonText)}
                </Button>
              </ButtonContainer>
            </>
          ) : null}
        </EmptyStateDiv>
      </EmptyStateContainer>
    );
  }
}

export default EmptyState;

interface Props {
  bigText: LocalizedString;
  icon: string;
  smallText?: LocalizedString;
  buttonIcon?: string;
  buttonText?: LocalizedString;
  buttonAction?: React.MouseEventHandler<HTMLDivElement>;
  componentAction?: JSX.Element;
  className?: string;
}
