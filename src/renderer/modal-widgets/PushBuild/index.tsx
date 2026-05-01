import { actions } from "common/actions";
import { Game, Profile } from "common/butlerd/messages";
import { ModalWidgetProps } from "common/modals";
import { PushBuildParams, PushBuildResponse } from "common/modals/types";
import { Dispatch, RootState } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import { hook } from "renderer/hocs/hook";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import ChannelList from "renderer/modal-widgets/PushBuild/ChannelList";
import GamePicker from "renderer/modal-widgets/PushBuild/GamePicker";
import PushBar from "renderer/modal-widgets/PushBuild/PushBar";
import RecentFolders from "renderer/modal-widgets/PushBuild/RecentFolders";
import SourcePicker from "renderer/modal-widgets/PushBuild/SourcePicker";
import { targetForGame } from "renderer/modal-widgets/PushBuild/target";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const Sub = styled.p`
  color: ${(props) => props.theme.secondaryText};
  margin: 0 0 16px 0;
`;

interface OwnProps
  extends ModalWidgetProps<PushBuildParams, PushBuildResponse> {}

interface MappedProps {
  profile: Profile | null;
}

type Props = OwnProps & MappedProps & { dispatch: Dispatch };

interface State {
  gameId: number | null;
  /** Display snapshot for the synthetic in-flight row in the dashboard. */
  gameTitle: string | null;
  gameCoverUrl: string | null;
  gameStillCoverUrl: string | null;
  /** wharf target ("user/slug") derived from the picked Game */
  target: string | null;
  channel: string | null;
  src: string | null;
}

class PushBuild extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    const { prefilledChannel, prefilledGame } = props.modal.widgetParams;
    const target = prefilledGame ? targetForGame(prefilledGame) : null;
    this.state = {
      gameId: prefilledGame?.id ?? null,
      gameTitle: prefilledGame?.title ?? null,
      gameCoverUrl: prefilledGame?.coverUrl ?? null,
      gameStillCoverUrl: prefilledGame?.stillCoverUrl ?? null,
      target,
      channel: prefilledChannel ?? null,
      src: null,
    };
  }

  override render() {
    const { profile } = this.props;
    if (!profile) return null;
    const { gameId, target, channel, src } = this.state;

    return (
      <ModalWidgetDiv>
        <Sub>{T(_("upload.subtitle_modal"))}</Sub>

        <GamePicker
          profile={profile}
          selectedGameId={gameId}
          onChange={this.handleGameChange}
        />

        <ChannelList
          key={target ?? ""}
          target={target}
          profileId={profile.id}
          selectedChannel={channel}
          onChange={this.handleChannelChange}
        />

        <SourcePicker src={src} onChange={this.handleSrcChange} />

        <RecentFolders selectedPath={src} onPick={this.handleSrcChange} />

        <PushBar
          gameId={gameId}
          gameTitle={this.state.gameTitle}
          gameCoverUrl={this.state.gameCoverUrl}
          gameStillCoverUrl={this.state.gameStillCoverUrl}
          target={target}
          channel={channel}
          src={src}
          onPushStarted={this.close}
        />
      </ModalWidgetDiv>
    );
  }

  close = () => {
    this.props.dispatch(
      actions.closeModal({
        wind: ambientWind(),
        id: this.props.modal.id,
        action: actions.modalResponse({}),
      })
    );
  };

  handleGameChange = (game: Game | null) => {
    if (!game) {
      this.setState({
        gameId: null,
        gameTitle: null,
        gameCoverUrl: null,
        gameStillCoverUrl: null,
        target: null,
        channel: null,
      });
      return;
    }
    const target = targetForGame(game);
    this.setState({
      gameId: game.id,
      gameTitle: game.title ?? null,
      gameCoverUrl: game.coverUrl ?? null,
      gameStillCoverUrl: game.stillCoverUrl ?? null,
      target,
      channel: null,
    });
  };

  handleChannelChange = (channel: string | null) => {
    this.setState({ channel });
  };

  handleSrcChange = (src: string | null) => {
    this.setState({ src });
  };
}

export default hook<MappedProps>((map) => ({
  profile: map((rs: RootState) => rs.profile?.profile ?? null),
}))(PushBuild as any);
