import { actions } from "common/actions";
import { Game, Profile } from "common/butlerd/messages";
import { ModalWidgetProps } from "common/modals";
import { PushBuildParams, PushBuildResponse } from "common/modals/types";
import { Dispatch, PreviewState, RootState } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import { hook } from "renderer/hocs/hook";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import ChannelList from "renderer/modal-widgets/PushBuild/ChannelList";
import GamePicker from "renderer/modal-widgets/PushBuild/GamePicker";
import PushBar from "renderer/modal-widgets/PushBuild/PushBar";
import RecentFolders from "renderer/modal-widgets/PushBuild/RecentFolders";
import ReviewPanel from "renderer/modal-widgets/PushBuild/ReviewPanel";
import SourcePicker from "renderer/modal-widgets/PushBuild/SourcePicker";
import { targetForGame } from "renderer/modal-widgets/PushBuild/target";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const Sub = styled.p`
  color: ${(props) => props.theme.secondaryText};
  margin: 0 0 16px 0;
`;

const PushBuildDialog = styled(ModalWidgetDiv)`
  box-sizing: border-box;
  width: clamp(760px, 88vw, 1200px);
`;

interface OwnProps
  extends ModalWidgetProps<PushBuildParams, PushBuildResponse> {}

interface MappedProps {
  profile: Profile | null;
  preview: PreviewState | null;
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
  /** True after the user clicked Push without a successful preview backing
   *  the current form. The next Push click pushes for real. Reset on form
   *  edits, on Preview click, and once a preview completes successfully. */
  pendingPushConfirm: boolean;
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
      pendingPushConfirm: false,
    };
  }

  override render() {
    const { profile } = this.props;
    if (!profile) return null;
    const { gameId, target, channel, src, pendingPushConfirm } = this.state;

    return (
      <PushBuildDialog>
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

        <ReviewPanel pendingPushConfirm={pendingPushConfirm} />

        <PushBar
          gameId={gameId}
          gameTitle={this.state.gameTitle}
          gameCoverUrl={this.state.gameCoverUrl}
          gameStillCoverUrl={this.state.gameStillCoverUrl}
          target={target}
          channel={channel}
          src={src}
          pendingPushConfirm={pendingPushConfirm}
          onSetPendingPushConfirm={this.setPendingPushConfirm}
          onPushStarted={this.close}
        />
      </PushBuildDialog>
    );
  }

  override componentDidUpdate(_prevProps: Props, prevState: State) {
    // Once a preview lands successfully, clear the "you didn't preview"
    // confirm — the next Push click should be unblocked.
    if (
      this.props.preview?.status === "done" &&
      this.state.pendingPushConfirm
    ) {
      // Use prevState to avoid loops once we've already cleared it.
      if (prevState.pendingPushConfirm) {
        this.setState({ pendingPushConfirm: false });
      }
    }
  }

  override componentWillUnmount() {
    this.discardPreview();
  }

  setPendingPushConfirm = (pendingPushConfirm: boolean) => {
    if (this.state.pendingPushConfirm !== pendingPushConfirm) {
      this.setState({ pendingPushConfirm });
    }
  };

  /** Cancel any in-flight preview, drop the slot, and reset the
   *  push-confirm step. Called from each field-change handler so a stale
   *  comparison or stale "I confirmed" state can never be acted on, and on
   *  unmount so closing the modal mid-preview doesn't leak a worker. */
  discardPreview = () => {
    const { dispatch, preview } = this.props;
    if (preview && preview.status === "running") {
      dispatch(actions.cancelPreview({ id: preview.id }));
    }
    if (preview) {
      dispatch(actions.clearPreview({}));
    }
    if (this.state.pendingPushConfirm) {
      this.setState({ pendingPushConfirm: false });
    }
  };

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
    this.discardPreview();
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
    this.discardPreview();
    this.setState({ channel });
  };

  handleSrcChange = (src: string | null) => {
    this.discardPreview();
    this.setState({ src });
  };
}

export default hook<MappedProps>((map) => ({
  profile: map((rs: RootState) => rs.profile?.profile ?? null),
  preview: map((rs: RootState) => rs.upload.currentPreview ?? null),
}))(PushBuild as any);
