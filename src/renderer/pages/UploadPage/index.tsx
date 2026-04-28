import React from "react";
import { ReactReduxContext } from "react-redux";
import { Game, Profile } from "common/butlerd/messages";
import { selectActivePushJob } from "common/reducers/upload";
import { Store } from "common/types";
import { withProfile } from "renderer/hocs/withProfile";
import { withTab } from "renderer/hocs/withTab";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import Page from "renderer/pages/common/Page";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

import GamePicker from "renderer/pages/UploadPage/GamePicker";
import ChannelList from "renderer/pages/UploadPage/ChannelList";
import SourcePicker from "renderer/pages/UploadPage/SourcePicker";
import PushBar from "renderer/pages/UploadPage/PushBar";
import { targetForGame } from "renderer/pages/UploadPage/target";

const Container = styled.div`
  padding: 24px;
  max-width: 720px;
  margin: 0 auto;
  overflow-y: auto;
  height: 100%;
`;

const Title = styled.h1`
  font-size: ${(props) => props.theme.fontSizes.huge};
  margin-bottom: 8px;
`;

const Sub = styled.p`
  color: ${(props) => props.theme.secondaryText};
  margin-bottom: 16px;
`;

interface Props extends MeatProps {
  profile: Profile;
  tab: string;
}

interface State {
  /** id of the selected game; selectedness drives GamePicker */
  gameId: number | null;
  /** wharf target ("user/slug") derived from the picked Game; null when the
   *  game's URL doesn't yield a parseable slug (custom domain) */
  target: string | null;
  channel: string | null;
  src: string | null;
  /** true when the picked game has no parseable target (custom domain) */
  unsupported: boolean;
}

const idleState: State = {
  gameId: null,
  target: null,
  channel: null,
  src: null,
  unsupported: false,
};

class UploadPage extends React.PureComponent<Props, State> {
  // We need the store at construction time to seed local state from any
  // in-flight push (so navigating back to the tab shows the picker
  // selections that match the running upload). Reading via context — rather
  // than subscribing via hook() — avoids re-rendering UploadPage on every
  // progress tick; PushBar subscribes for the live progress separately.
  static override contextType = ReactReduxContext;
  declare context: React.ContextType<typeof ReactReduxContext>;

  constructor(
    props: Props,
    context: React.ContextType<typeof ReactReduxContext>
  ) {
    super(props, context);
    const store = context.store as Store;
    const job = selectActivePushJob(store.getState().upload);
    this.state = job
      ? {
          gameId: job.gameId,
          target: job.target,
          channel: job.channel,
          src: job.src,
          unsupported: false,
        }
      : idleState;
  }

  override render() {
    const { profile } = this.props;
    const { gameId, target, channel, src, unsupported } = this.state;

    return (
      <Page>
        <Container>
          <Title>{T(_("upload.title"))}</Title>
          <Sub>{T(_("upload.subtitle"))}</Sub>

          <GamePicker
            profile={profile}
            selectedGameId={gameId}
            onChange={this.handleGameChange}
          />

          {unsupported ? <p>{T(_("upload.unsupported_target"))}</p> : null}

          <ChannelList
            key={target ?? ""}
            target={target}
            profileId={profile.id}
            selectedChannel={channel}
            onChange={this.handleChannelChange}
          />

          <SourcePicker src={src} onChange={this.handleSrcChange} />

          <PushBar
            gameId={gameId}
            target={target}
            channel={channel}
            src={src}
          />
        </Container>
      </Page>
    );
  }

  handleGameChange = (game: Game | null) => {
    if (!game) {
      this.setState(idleState);
      return;
    }
    const target = targetForGame(game, this.props.profile);
    this.setState({
      gameId: game.id,
      target,
      channel: null,
      unsupported: target === null,
    });
  };

  handleChannelChange = (channel: string | null) => {
    this.setState({ channel });
  };

  handleSrcChange = (src: string | null) => {
    this.setState({ src });
  };
}

export default withProfile(withTab(UploadPage));
