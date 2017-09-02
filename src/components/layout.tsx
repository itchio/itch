import * as React from "react";
import { createStructuredSelector } from "reselect";
import { connect } from "./connect";

import GatePage from "./pages/gate";
import HubPage from "./pages/hub";
import StatusBar from "./status-bar";
import NonLocalIndicator from "./non-local-indicator";
import ReactHint = require("react-hint");

import { IRootState } from "../types";

import styled from "./styles";

const LayoutContainer = styled.div`
  background: ${props => props.theme.baseBackground};
  color: ${props => props.theme.baseText};
  font-size: ${props => props.theme.fontSizes.baseText};

  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 2px;

  &,
  input {
    font-family: LatoWeb, sans-serif;
  }
`;

const ReactHintContainer = styled.div`
  pointer-events: none;

  .react-hint__content {
    padding: 5px;
    border-radius: 2px;
    background: ${props => props.theme.tooltipBackground};
    color: ${props => props.theme.tooltipText};
    font-size: 90%;
  }

  .react-hint--top:after {
    border-top-color: ${props => props.theme.tooltipBackground};
  }

  .react-hint--left:after {
    border-left-color: ${props => props.theme.tooltipBackground};
  }

  .react-hint--right:after {
    border-right-color: ${props => props.theme.tooltipBackground};
  }

  .react-hint--bottom:after {
    border-bottom-color: ${props => props.theme.tooltipBackground};
  }
`;

declare class Notification {
  onclick: () => void;

  constructor(title: string, opts: any);
}

/**
 * Top-level component in the app, decides which page to show
 * Also, subscribes to app store to synchronize its state
 */
class Layout extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    return (
      <LayoutContainer>
        {this.main()}
        <StatusBar />
        <ReactHintContainer>
          <ReactHint />
        </ReactHintContainer>
        <NonLocalIndicator />
      </LayoutContainer>
    );
  }

  main() {
    const { page } = this.props;

    switch (page) {
      case "gate":
        return <GatePage />;
      case "hub":
        return <HubPage />;
      default:
        return (
          <div>
            Unknown page: {page}
          </div>
        );
    }
  }
}

interface IProps {}

interface IDerivedProps {
  page: string;
}

export default connect<IProps>(Layout, {
  state: createStructuredSelector({
    page: (rs: IRootState) => rs.session.navigation.page,
  }),
});
