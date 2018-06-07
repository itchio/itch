import React from "react";
import { createStructuredSelector } from "reselect";
import { connect } from "./connect";

import GatePage from "./pages/gate";
import HubPage from "./pages/hub";
import StatusBar from "./status-bar";
import NonLocalIndicator from "./non-local-indicator";
import ContextMenuHandler from "./context-menu-handler";
import ReactHintFactory from "react-hint";
const ReactHint = ReactHintFactory(React);

import { IRootState } from "common/types";

import styled from "./styles";
import { TString } from "renderer/t";
import { injectIntl, InjectedIntl } from "react-intl";
import { formatDate, DATE_FORMAT } from "common/format/datetime";
import classNames from "classnames";
import { rendererWindow } from "common/util/navigation";

const LayoutContainer = styled.div`
  background: ${props => props.theme.baseBackground};
  color: ${props => props.theme.baseText};
  font-size: ${props => props.theme.fontSizes.baseText};

  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 2px;

  &.maximized {
    border-color: transparent;
  }

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

/**
 * Top-level component in the app, decides which page to show
 * Also, subscribes to app store to synchronize its state
 */
class Layout extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { maximized } = this.props;

    return (
      <LayoutContainer className={classNames({ maximized })}>
        {this.main()}
        <StatusBar />
        <ReactHintContainer>{this.renderReactHint()}</ReactHintContainer>
        <NonLocalIndicator />
        <ContextMenuHandler />
      </LayoutContainer>
    );
  }

  main() {
    const { ready } = this.props;
    if (ready) {
      return <HubPage />;
    } else {
      return <GatePage />;
    }
  }

  renderReactHint(): JSX.Element {
    const { intl } = this.props;
    return (
      <ReactHint
        events
        onRenderContent={(target, content) => {
          let { rh } = target.dataset;
          if (!rh) {
            return null;
          }

          const firstChar = rh[0];
          if (firstChar === "[" || firstChar === "{" || firstChar === `"`) {
            try {
              const obj = JSON.parse(rh);
              if (Array.isArray(obj)) {
                rh = TString(intl, obj);
              } else if (obj.hasOwnProperty("date")) {
                rh = formatDate(new Date(obj.date), intl.locale, DATE_FORMAT);
              } else {
                rh = obj;
              }
            } catch (e) {
              // muffin
            }
          }
          if (!rh) {
            return null;
          }

          return <div className="react-hint__content">{rh}</div>;
        }}
      />
    );
  }
}

interface IProps {}

interface IDerivedProps {
  ready: boolean;
  maximized: boolean;

  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(Layout), {
  state: createStructuredSelector({
    maximized: (rs: IRootState) =>
      rs.windows[rendererWindow()].native.maximized,
    ready: (rs: IRootState) => rs.setup.done && rs.profile.credentials.me,
  }),
});
