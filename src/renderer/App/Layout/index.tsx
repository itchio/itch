import classNames from "classnames";
import { Profile } from "common/butlerd/messages";
import { ambientWind } from "common/util/navigation";
import React from "react";
import HintTooltip from "renderer/App/HintTooltip";
import NonLocalIndicator from "renderer/App/Layout/NonLocalIndicator";
import StatusBar from "renderer/App/Layout/StatusBar";
import { hook } from "renderer/hocs/hook";
import { ProfileProvider } from "renderer/hocs/withProfile";
import styled, * as styles from "renderer/styles";
import GateScene from "renderer/scenes/GateScene";
import HubScene from "renderer/scenes/HubScene";

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

/**
 * Top-level component in the app, decides which page to show
 * Also, subscribes to app store to synchronize its state
 */
class Layout extends React.PureComponent<Props> {
  override render() {
    const { maximized, focused, hasModal } = this.props;

    return (
      <LayoutContainer className={classNames({ maximized, focused })}>
        {this.main()}
        {ambientWind() === "root" ? <StatusBar /> : null}
        {/* while a modal is open, its own HintTooltip instance takes
            over: this one would shine through the translucent backdrop */}
        {hasModal ? null : <HintTooltip />}
        <NonLocalIndicator />
      </LayoutContainer>
    );
  }

  main() {
    const { ready, profile } = this.props;
    if (ready && profile) {
      return (
        <ProfileProvider value={profile}>
          <HubScene />
        </ProfileProvider>
      );
    } else {
      return <GateScene />;
    }
  }
}

interface Props {
  ready: boolean;
  maximized: boolean;
  focused: boolean;
  hasModal: boolean;
  profile: Profile | null;
}

export default hook((map) => ({
  maximized: map((rs) => {
    const wind = rs.winds[ambientWind()];
    if (wind) {
      return wind.native.maximized;
    } else {
      return false;
    }
  }),
  focused: map((rs) => {
    const wind = rs.winds[ambientWind()];
    if (wind) {
      return wind.native.focused;
    } else {
      return false;
    }
  }),
  ready: map((rs) => !!(rs.setup.done && rs.profile.profile)),
  hasModal: map((rs) => {
    const wind = rs.winds[ambientWind()];
    return wind ? wind.modals.length > 0 : false;
  }),
  profile: map((rs) => rs.profile.profile),
}))(Layout);
