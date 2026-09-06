import { actions } from "common/actions";
import urls from "common/constants/urls";
import { ModalWidgetProps } from "common/modals";
import {
  SteamSyncOnboardingParams,
  SteamSyncOnboardingResponse,
} from "common/modals/types";
import { Dispatch, RootState, SteamSyncState } from "common/types";
import { ambientWind } from "common/util/navigation";
import uuid from "common/util/uuid";
import { lighten, transparentize } from "polished";
import QRCode from "qrcode";
import React from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import Button from "renderer/basics/Button";
import Icon from "renderer/basics/Icon";
import Link from "renderer/basics/Link";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { ModalButtons } from "renderer/basics/modal-styles";
import { hookWithProps } from "renderer/hocs/hook";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { IntlShape } from "react-intl";
import { injectIntl } from "renderer/hocs/injectIntl";
import { T, TString } from "renderer/t";

const Footer = styled(ModalButtons)`
  gap: 8px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 600px;
  max-width: 90vw;
`;

// Every tab gets the tallest tab's height so the modal stays put when
// switching. The overview is the tallest.
const Panel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-top: 10px;
  min-height: 560px;

  > :last-child {
    margin-top: auto;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionTitle = styled.div`
  font-weight: bold;
`;

const Body = styled.div`
  line-height: 1.5;
  color: ${(props) => props.theme.secondaryText};

  strong {
    color: ${(props) => props.theme.baseText};
  }
`;

const QRRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 24px;
  align-items: flex-start;
`;

const QRBox = styled.div`
  width: 220px;
  height: 220px;
  box-sizing: border-box;
  flex-shrink: 0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.code {
    background: white;
    padding: 8px;
  }

  &.pending {
    background: ${(props) => props.theme.itemBackground};
    border: 1px solid ${(props) => props.theme.inputBorder};
  }

  canvas {
    display: block;
  }
`;

const QRText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  line-height: 1.5;
`;

const Status = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  color: ${(props) => props.theme.secondaryText};
`;

const Note = styled.div`
  font-size: ${(props) => props.theme.fontSizes.smaller};
  color: ${(props) => props.theme.secondaryText};
  line-height: 1.5;
`;

const AccountCard = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: ${(props) => props.theme.itemBackground};
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 4px;
`;

const AccountName = styled.div`
  flex: 1;
  min-width: 0;
  font-weight: bold;
  font-size: ${(props) => props.theme.fontSizes.large};
`;

// same recipe as SteamShortcuts' Callout and PushBuild's ConfirmCallout
const Callout = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 4px;
  background: ${(props) => transparentize(0.88, props.theme.error)};
  border: 1px solid ${(props) => transparentize(0.65, props.theme.error)};
  color: ${(props) => props.theme.baseText};
  line-height: 1.45;

  .icon {
    color: ${(props) => lighten(0.08, props.theme.error)};
    margin-top: 2px;
    font-size: 110%;
  }
`;

const KeyInput = styled.input`
  width: 100% !important;
  box-sizing: border-box;
  margin: 0 !important;
  font-family: monospace;
`;

interface Props
  extends ModalWidgetProps<
    SteamSyncOnboardingParams,
    SteamSyncOnboardingResponse
  > {
  dispatch: Dispatch;
  steamSync: SteamSyncState;
  intl: IntlShape;
}

interface State {
  key: string;
  /** Tab the person picked. Cleared whenever the natural step moves on. */
  tab: Step | null;
  /** The intro is shown once before the first sign-in, then only on request. */
  seenIntro: boolean;
}

type Step = "intro" | "login" | "key" | "done";

const STEPS: Step[] = ["intro", "login", "key", "done"];

function stepFor(s: SteamSyncState): Step {
  if (!s.status || !s.status.loggedIn) {
    return "login";
  }
  if (!s.status.hasPublisherKey) {
    return "key";
  }
  return "done";
}

// Tabs unlock in order, so the reachable ones are those up to and
// including the natural step. The intro is always open.
function reachable(s: SteamSyncState, step: Step): boolean {
  return STEPS.indexOf(step) <= STEPS.indexOf(stepFor(s));
}

class SteamSyncOnboarding extends React.PureComponent<Props, State> {
  override state: State = { key: "", tab: null, seenIntro: false };

  canvas: HTMLCanvasElement | null = null;
  qrForUrl?: string;

  override componentDidMount() {
    this.props.dispatch(actions.steamSyncFetchStatus({}));
    this.ensureLogin();
    this.renderQR();
  }

  override componentDidUpdate(prevProps: Props) {
    if (stepFor(prevProps.steamSync) !== stepFor(this.props.steamSync)) {
      // Let the tab settle first; ensureLogin runs again on the next
      // update and must see the tab that is actually showing.
      this.setState({ tab: null });
      return;
    }
    this.ensureLogin();
    this.renderQR();
  }

  currentTab(): Step {
    const { tab, seenIntro } = this.state;
    const s = this.props.steamSync;
    if (tab && reachable(s, tab)) {
      return tab;
    }
    if (s.status && !s.status.loggedIn && !seenIntro) {
      return "intro";
    }
    return stepFor(s);
  }

  onTabSelected = (index: number) => {
    const tab = STEPS[index];
    if (tab && reachable(this.props.steamSync, tab)) {
      this.setState({ tab });
    }
  };

  gotCanvas = (canvas: HTMLCanvasElement | null) => {
    this.canvas = canvas;
    this.qrForUrl = undefined;
    this.renderQR();
  };

  override componentWillUnmount() {
    const { login } = this.props.steamSync;
    if (login) {
      this.props.dispatch(actions.steamSyncCancelLogin({ id: login.id }));
    }
  }

  // Start the QR login as soon as the sign-in tab is showing, without a
  // click. Not after a failure though: the person gets a retry button.
  ensureLogin() {
    const s = this.props.steamSync;
    if (!s.status || this.currentTab() !== "login" || s.login || s.loginError) {
      return;
    }
    this.startLogin();
  }

  startLogin = () => {
    this.props.dispatch(actions.steamSyncStartLogin({ id: uuid() }));
  };

  // Drawn on a canvas rather than an <img>: the renderer's CSP does not
  // allow data: image sources.
  renderQR() {
    const url = this.props.steamSync.login?.challengeUrl;
    if (!url || !this.canvas || url === this.qrForUrl) {
      return;
    }
    this.qrForUrl = url;
    QRCode.toCanvas(this.canvas, url, {
      margin: 1,
      width: 204,
      errorCorrectionLevel: "L",
    }).catch(() => {});
  }

  override render() {
    const s = this.props.steamSync;
    const tab = this.currentTab();
    return (
      <ModalWidgetDiv>
        <Container>
          <Tabs
            selectedIndex={STEPS.indexOf(tab)}
            onSelect={this.onTabSelected}
          >
            <TabList>
              <Tab>{T(["steam_sync.steps.intro"])}</Tab>
              <Tab>{T(["steam_sync.steps.login"])}</Tab>
              <Tab disabled={!reachable(s, "key")}>
                {T(["steam_sync.steps.key"])}
              </Tab>
              <Tab disabled={!reachable(s, "done")}>
                {T(["steam_sync.steps.done"])}
              </Tab>
            </TabList>
            <TabPanel>
              <Panel>{this.renderIntro()}</Panel>
            </TabPanel>
            <TabPanel>
              <Panel>
                {s.status?.loggedIn
                  ? this.renderSignedIn()
                  : this.renderLogin()}
              </Panel>
            </TabPanel>
            <TabPanel>
              <Panel>{this.renderKey()}</Panel>
            </TabPanel>
            <TabPanel>
              <Panel>{this.renderDone()}</Panel>
            </TabPanel>
          </Tabs>
        </Container>
      </ModalWidgetDiv>
    );
  }

  renderIntro() {
    return (
      <>
        <Body>{T(["steam_sync.intro.what"])}</Body>
        <Section>
          <SectionTitle>{T(["steam_sync.intro.login_title"])}</SectionTitle>
          <Body>{T(["steam_sync.intro.login"])}</Body>
          <Body>{T(["steam_sync.intro.login_disconnect"])}</Body>
        </Section>
        <Section>
          <SectionTitle>{T(["steam_sync.intro.key_title"])}</SectionTitle>
          <Body>{T(["steam_sync.intro.key"])}</Body>
        </Section>
        <Footer>
          <Button onClick={this.onClose}>{T(["prompt.action.cancel"])}</Button>
          <Button primary onClick={this.onIntroContinue}>
            {T(["prompt.action.continue"])}
          </Button>
        </Footer>
      </>
    );
  }

  onIntroContinue = () => {
    this.setState({ seenIntro: true, tab: null });
  };

  // The sign-in tab revisited after signing in. Switching accounts drops
  // the publisher key too: it belongs to a partner account, and the next
  // Steam account may not be in it.
  renderSignedIn() {
    const { status } = this.props.steamSync;
    return (
      <>
        <AccountCard>
          <AccountName>{status?.accountName}</AccountName>
          <Link onClick={this.onLogOut}>{T(["steam_sync.login.log_out"])}</Link>
        </AccountCard>
        <Note>{T(["steam_sync.signed_in.log_out_note"])}</Note>
        <Footer>
          <Button primary onClick={this.onNext}>
            {T(["prompt.action.continue"])}
          </Button>
        </Footer>
      </>
    );
  }

  // Anchors with target="_blank" open as in-app tabs; the partner site
  // belongs in the real browser.
  openExternal = (url: string) => {
    this.props.dispatch(actions.openInExternalBrowser({ url }));
  };

  onLogOut = () => {
    // They have been through the intro; land on the QR, not the overview.
    this.setState({ seenIntro: true, tab: null });
    this.props.dispatch(actions.steamSyncDisconnect({}));
  };

  onNext = () => {
    const next = STEPS[STEPS.indexOf(this.currentTab()) + 1];
    if (next && reachable(this.props.steamSync, next)) {
      this.setState({ tab: next });
    }
  };

  renderLogin() {
    const { login, loginError } = this.props.steamSync;
    const url = login?.challengeUrl;
    return (
      <>
        {loginError ? (
          <>
            <Callout>
              <Icon icon="error" />
              <span>{T(loginError)}</span>
            </Callout>
            <Footer>
              <Button onClick={this.onClose}>
                {T(["prompt.action.cancel"])}
              </Button>
              <Button primary onClick={this.startLogin}>
                {T(["steam_sync.login.retry"])}
              </Button>
            </Footer>
          </>
        ) : (
          <>
            <QRRow>
              {url ? (
                <QRBox className="code">
                  <canvas ref={this.gotCanvas} />
                </QRBox>
              ) : (
                <QRBox className="pending">
                  <LoadingCircle progress={-1} bare huge />
                </QRBox>
              )}
              <QRText>
                <div>{T(["steam_sync.login.instructions"])}</div>
                <Status>
                  <LoadingCircle progress={-1} bare />
                  <div>
                    {T([
                      url
                        ? "steam_sync.login.status_waiting"
                        : "steam_sync.login.status_pending",
                    ])}
                  </div>
                </Status>
              </QRText>
            </QRRow>
            <Footer>
              <Button onClick={this.onClose}>
                {T(["prompt.action.cancel"])}
              </Button>
            </Footer>
          </>
        )}
      </>
    );
  }

  renderKey() {
    const { status, keySaving, keyError } = this.props.steamSync;
    const { key } = this.state;
    return (
      <>
        <Body>
          {T(["steam_sync.key.why"])} {T(["steam_sync.key.where"])}{" "}
          <Link onClick={() => this.openExternal(urls.steamPartnerGroups)}>
            {T(["steam_sync.key.open_partner_site"])}
          </Link>
        </Body>
        <KeyInput
          type="password"
          autoFocus
          disabled={keySaving}
          value={key}
          placeholder={TString(this.props.intl, ["steam_sync.key.placeholder"])}
          onChange={(ev) => this.setState({ key: ev.currentTarget.value })}
          onKeyDown={(ev) => {
            if (ev.key === "Enter") {
              this.onSaveKey();
            }
          }}
        />
        {keyError ? (
          <Callout>
            <Icon icon="error" />
            <span>{T(keyError)}</span>
          </Callout>
        ) : null}
        <Footer>
          <Button onClick={this.onClose}>{T(["prompt.action.cancel"])}</Button>
          <Button
            primary
            disabled={keySaving || key.trim() === ""}
            onClick={this.onSaveKey}
          >
            {keySaving ? (
              <LoadingCircle progress={-1} bare />
            ) : (
              T(["steam_sync.key.save"])
            )}
          </Button>
        </Footer>
      </>
    );
  }

  renderDone() {
    const { status } = this.props.steamSync;
    return (
      <>
        <Body>
          {T([
            "steam_sync.done.body",
            { accountName: status?.accountName ?? "" },
          ])}
        </Body>
        <Footer>
          <Button onClick={this.onClose}>{T(["prompt.action.close"])}</Button>
          <Button primary onClick={this.onChooseApps}>
            {T(["steam_sync.done.choose_apps"])}
          </Button>
        </Footer>
      </>
    );
  }

  onSaveKey = () => {
    const key = this.state.key.trim();
    if (key === "" || this.props.steamSync.keySaving) {
      return;
    }
    this.props.dispatch(actions.steamSyncSetPublisherKey({ key }));
  };

  onChooseApps = () => {
    this.props.dispatch(
      actions.closeModal({
        wind: ambientWind(),
        id: this.props.modal.id,
        action: actions.steamSyncOpenApps({}),
      })
    );
  };

  onClose = () => {
    this.props.dispatch(
      actions.closeModal({ wind: ambientWind(), id: this.props.modal.id })
    );
  };
}

export default injectIntl(
  hookWithProps(SteamSyncOnboarding)((map) => ({
    steamSync: map((rs: RootState) => rs.steamSync),
  }))(SteamSyncOnboarding)
);
