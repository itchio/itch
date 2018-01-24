import * as React from "react";
import { connect } from "./connect";

import Icon from "./basics/icon";

import styled from "./styles";
import Button from "./basics/button";

const EmptyStateDiv = styled.div`
  color: ${props => props.theme.secondaryText};
  width: 100%;
  text-align: center;

  .leader {
    display: inline-block;
    font-size: 170px;
    margin-bottom: 20px;
  }

  h1 {
    font-size: ${props => props.theme.fontSizes.enormous};
    font-weight: bold;
    margin-bottom: 10px;
  }

  h2 {
    font-size: ${props => props.theme.fontSizes.huge};
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

export class EmptyState extends React.PureComponent<IProps, any> {
  render() {
    const {
      bigText,
      smallText,
      icon,
      buttonIcon,
      buttonText,
      buttonAction,
      className,
    } = this.props;

    return (
      <EmptyStateContainer>
        <EmptyStateDiv className={className}>
          <Icon icon={icon} className="leader" />
          <h1>{bigText}</h1>
          <h2>{smallText}</h2>
          <ButtonContainer>
            <Button icon={buttonIcon} primary discreet onClick={buttonAction}>
              {buttonText}
            </Button>
          </ButtonContainer>
        </EmptyStateDiv>
      </EmptyStateContainer>
    );
  }
}

interface IProps {
  className?: string;
  bigText: string;
  smallText?: string;
  icon: string;
  buttonIcon?: string;
  buttonText?: string;
  buttonAction?: React.MouseEventHandler<HTMLDivElement>;
}

export default connect<IProps>(EmptyState, {});
