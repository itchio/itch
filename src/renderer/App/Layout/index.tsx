import classNames from "classnames";
import { Profile } from "common/butlerd/messages";
import { DATE_FORMAT, formatDate } from "common/format/datetime";
import { ambientWind } from "common/util/navigation";
import React from "react";
import ReactHintFactory from "react-hint";
import NonLocalIndicator from "renderer/App/Layout/NonLocalIndicator";
import StatusBar from "renderer/App/Layout/StatusBar";
import { hook } from "renderer/hocs/hook";
import { ProfileProvider } from "renderer/hocs/withProfile";
import styled, * as styles from "renderer/styles";
import { TString } from "renderer/t";
import Loadable from "react-loadable";
import { injectIntl, IntlShape } from "react-intl";

const GateScene = Loadable({
  loader: () => import("renderer/scenes/GateScene"),
  loading: () => null,
});
const HubScene = Loadable({
  loader: () => import("renderer/scenes/HubScene"),
  loading: () => null,
});

const ReactHint = ReactHintFactory(React);

const LayoutContainer = styled.div`
  background: ${(props) => props.theme.baseBackground};
  color: ${(props) => props.theme.baseText};
  font-size: ${(props) => props.theme.fontSizes.baseText};

  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  &:not(.maximized) {
    ${styles.windowBorder};
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
    background: ${(props) => props.theme.tooltipBackground};
    color: ${(props) => props.theme.tooltipText};
    font-size: 90%;
  }

  .react-hint--top:after {
    border-top-color: ${(props) => props.theme.tooltipBackground};
  }

  .react-hint--left:after {
    border-left-color: ${(props) => props.theme.tooltipBackground};
  }

  .react-hint--right:after {
    border-right-color: ${(props) => props.theme.tooltipBackground};
  }

  .react-hint--bottom:after {
    border-bottom-color: ${(props) => props.theme.tooltipBackground};
  }
`;

/**
 * Top-level component in the app, decides which page to show
 * Also, subscribes to app store to synchronize its state
 */
class Layout extends React.PureComponent<Props> {
  render() {
    const { maximized, focused } = this.props;

    return (
      <LayoutContainer className={classNames({ maximized, focused })}>
        {this.main()}
        {ambientWind() === "root" ? <StatusBar /> : null}
        <ReactHintContainer>{this.renderReactHint()}</ReactHintContainer>
        <NonLocalIndicator />
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
    return <ReactHint events onRenderContent={this.renderReactHintContent} />;
  }

  renderReactHintContent = (target, content) => {
    const { intl } = this.props;
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
  };
}

interface Props {
  ready: boolean;
  maximized: boolean;
  focused: boolean;
  profile: Profile;

  intl: IntlShape;
}

export default injectIntl(
  hook((map) => ({
    maximized: map((rs) => rs.winds[ambientWind()].native.maximized),
    focused: map((rs) => rs.winds[ambientWind()].native.focused),
    ready: map((rs) => !!(rs.setup.done && rs.profile.profile)),
    profile: map((rs) => rs.profile.profile),
  }))(Layout)
);
