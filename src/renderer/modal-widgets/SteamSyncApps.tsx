import { actions } from "common/actions";
import urls from "common/constants/urls";
import { ModalWidgetProps } from "common/modals";
import {
  SteamSyncAppsParams,
  SteamSyncAppsResponse,
} from "common/modals/types";
import { Dispatch, RootState, SteamSyncState } from "common/types";
import { ambientWind } from "common/util/navigation";
import { lighten, transparentize } from "polished";
import React from "react";
import Button from "renderer/basics/Button";
import Icon from "renderer/basics/Icon";
import Link from "renderer/basics/Link";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { ModalButtons } from "renderer/basics/modal-styles";
import { hookWithProps } from "renderer/hocs/hook";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { T } from "renderer/t";

const Buttons = styled(ModalButtons)`
  gap: 8px;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 620px;
  max-width: 90vw;
`;

const Intro = styled.div`
  color: ${(props) => props.theme.secondaryText};
  line-height: 1.5;
`;

const List = styled.div`
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 4px;
  background: ${(props) => props.theme.itemBackground};
  max-height: 50vh;
  overflow-y: auto;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 90px 80px auto;
  gap: 12px;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid ${(props) => props.theme.inputBorder};

  &:last-child {
    border-bottom: none;
  }
`;

const Name = styled.div`
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Dim = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.smaller};
`;

const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  color: ${(props) => props.theme.secondaryText};
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

const Footer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.smaller};
`;

const Spacer = styled.div`
  flex: 1;
`;

interface Props
  extends ModalWidgetProps<SteamSyncAppsParams, SteamSyncAppsResponse> {
  dispatch: Dispatch;
  steamSync: SteamSyncState;
}

class SteamSyncApps extends React.PureComponent<Props> {
  override componentDidMount() {
    if (!this.props.steamSync.apps) {
      this.props.dispatch(actions.steamSyncFetchApps({}));
    }
  }

  override componentDidUpdate() {
    // Disconnect, or a key that stopped working, sends people back to
    // onboarding rather than leaving them on an empty list.
    const { status } = this.props.steamSync;
    if (status && !(status.loggedIn && status.hasPublisherKey)) {
      this.onClose();
      this.props.dispatch(actions.steamSyncOpen({}));
    }
  }

  override render() {
    const { status } = this.props.steamSync;
    return (
      <ModalWidgetDiv>
        <Container>
          <Intro>{T(["steam_sync.apps.intro"])}</Intro>
          {this.renderList()}
          <Footer>
            {status?.accountName
              ? T([
                  "steam_sync.apps.signed_in_as",
                  { accountName: status.accountName },
                ])
              : null}
            <Spacer />
            <Button onClick={this.onRefresh}>
              {T(["steam_sync.apps.refresh"])}
            </Button>
            <Button onClick={this.onDisconnect}>
              {T(["steam_sync.apps.disconnect"])}
            </Button>
          </Footer>
          <Buttons>
            <Button onClick={this.onClose}>{T(["prompt.action.close"])}</Button>
          </Buttons>
        </Container>
      </ModalWidgetDiv>
    );
  }

  renderList() {
    const { apps, appsLoading, appsError } = this.props.steamSync;
    if (appsError) {
      return (
        <Callout>
          <Icon icon="error" />
          <span>{T(appsError)}</span>
        </Callout>
      );
    }
    if (!apps || appsLoading) {
      return (
        <List>
          <Center>
            <LoadingCircle progress={-1} bare />
            {T(["steam_sync.apps.loading"])}
          </Center>
        </List>
      );
    }
    if (apps.length === 0) {
      return (
        <List>
          <Center>
            {T(["steam_sync.apps.empty"])}{" "}
            <Link onClick={this.openPartnerSite}>
              {T(["steam_sync.key.open_partner_site"])}
            </Link>
          </Center>
        </List>
      );
    }
    return (
      <List>
        {apps.map((a) => (
          <Row key={a.id}>
            <Name title={a.name}>{a.name}</Name>
            <Dim>{a.id}</Dim>
            <Dim>{a.type}</Dim>
            <Button disabled hint={["steam_sync.apps.set_up_hint"]}>
              {T(["steam_sync.apps.set_up"])}
            </Button>
          </Row>
        ))}
      </List>
    );
  }

  openPartnerSite = () => {
    this.props.dispatch(
      actions.openInExternalBrowser({ url: urls.steamPartnerGroups })
    );
  };

  onRefresh = () => {
    this.props.dispatch(actions.steamSyncFetchApps({}));
  };

  onDisconnect = () => {
    this.props.dispatch(actions.steamSyncDisconnect({}));
  };

  onClose = () => {
    this.props.dispatch(
      actions.closeModal({ wind: ambientWind(), id: this.props.modal.id })
    );
  };
}

export default hookWithProps(SteamSyncApps)((map) => ({
  steamSync: map((rs: RootState) => rs.steamSync),
}))(SteamSyncApps);
