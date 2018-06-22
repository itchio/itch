import classNames from "classnames";
import { DATE_FORMAT, formatDate } from "common/format/datetime";
import { IRootState } from "common/types";
import { rendererWindow } from "common/util/navigation";
import React from "react";
import ReactHintFactory from "react-hint";
import { InjectedIntl, injectIntl } from "react-intl";
import ContextMenuHandler from "renderer/App/Layout/ContextMenuHandler";
import NonLocalIndicator from "renderer/App/Layout/NonLocalIndicator";
import StatusBar from "renderer/App/Layout/StatusBar";
import { connect } from "renderer/hocs/connect";
import GateScene from "renderer/scenes/GateScene";
import HubScene from "renderer/scenes/HubScene";
import styled from "renderer/styles";
import { TString } from "renderer/t";
import { createStructuredSelector } from "reselect";
import { ProfileProvider } from "renderer/hocs/withProfile";
import { Profile } from "common/butlerd/messages";

const ReactHint = ReactHintFactory(React);

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
class Layout extends React.PureComponent<Props & DerivedProps> {
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
      return (
        <ProfileProvider value={this.props.profile}>
          <HubScene />
        </ProfileProvider>
      );
    } else {
      return <GateScene />;
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

interface Props {}

interface DerivedProps {
  ready: boolean;
  maximized: boolean;
  profile: Profile;

  intl: InjectedIntl;
}

export default connect<Props>(
  injectIntl(Layout),
  {
    state: createStructuredSelector({
      maximized: (rs: IRootState) =>
        rs.windows[rendererWindow()].native.maximized,
      ready: (rs: IRootState) => rs.setup.done && rs.profile.profile,
      profile: (rs: IRootState) => rs.profile.profile,
    }),
  }
);
