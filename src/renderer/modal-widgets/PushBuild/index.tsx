import { actions } from "common/actions";
import { Game, Profile } from "common/butlerd/messages";
import { ModalWidgetProps } from "common/modals";
import { PushBuildParams, PushBuildResponse } from "common/modals/types";
import { Dispatch, PreviewState, RootState } from "common/types";
import { ambientNavigation, ambientWind } from "common/util/navigation";
import React from "react";
import Checkbox from "renderer/basics/Checkbox";
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

const OptionsRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
  margin: 8px 0 0;
  flex-wrap: wrap;
`;

const UserVersionLabel = styled.label`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.baseText};
`;

const UserVersionInput = styled.input`
  padding: 6px 8px;
  background: ${(props) => props.theme.inputBackground};
  color: ${(props) => props.theme.baseText};
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 2px;
  font-family: monospace;
  width: 240px;
`;

const HiddenLabel = styled.label`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  color: ${(props) => props.theme.secondaryText};
  cursor: pointer;
`;

interface OwnProps
  extends ModalWidgetProps<PushBuildParams, PushBuildResponse> {}

interface MappedProps {
  profile: Profile | null;
  preview: PreviewState | null;
  /** the active tab is already showing itch://upload */
  onUploadPage: boolean;
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
  /** Optional --userversion string. Empty string is treated as unset. */
  userVersion: string;
  /** Mark a brand-new channel as hidden on creation. Only meaningful
   *  (and only surfaced) when the typed channel name isn't already in
   *  existingChannels. */
  hidden: boolean;
  /** Names of channels that already exist for the current target, as
   *  reported by ChannelList once Publish.ListChannels resolves. null
   *  while loading or before a target is picked. */
  existingChannels: ReadonlySet<string> | null;
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
      userVersion: "",
      hidden: false,
      existingChannels: null,
      pendingPushConfirm: false,
    };
  }

  override render() {
    const { profile } = this.props;
    if (!profile) return null;
    const {
      gameId,
      target,
      channel,
      src,
      userVersion,
      hidden,
      existingChannels,
      pendingPushConfirm,
    } = this.state;

    // The hidden-on-creation toggle only makes sense for channels that
    // don't yet exist. We hide the row entirely until ListChannels has
    // resolved so we don't flash the option while the channel set is
    // unknown — better to omit briefly than to show a misleading toggle.
    const isNewChannel =
      !!channel && existingChannels !== null && !existingChannels.has(channel);

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
          onExistingChannels={this.handleExistingChannels}
        />

        <SourcePicker src={src} onChange={this.handleSrcChange} />

        <RecentFolders selectedPath={src} onPick={this.handleSrcChange} />

        <OptionsRow>
          <UserVersionLabel>
            <span>{T(_("upload.user_version"))}</span>
            <UserVersionInput
              type="text"
              placeholder="e.g. 1.2.3"
              value={userVersion}
              onChange={this.handleUserVersionChange}
            />
          </UserVersionLabel>
          {isNewChannel ? (
            <HiddenLabel title="When checked, the new channel will be created hidden. It won't be visible on your project page or in downloads until you unhide it from the itch.io dashboard. Subsequent pushes to the same channel keep it hidden until you change it.">
              <Checkbox checked={hidden} onChange={this.handleHiddenChange} />
              <span>{T(_("upload.hidden_on_creation"))}</span>
            </HiddenLabel>
          ) : null}
        </OptionsRow>

        <ReviewPanel pendingPushConfirm={pendingPushConfirm} />

        <PushBar
          gameId={gameId}
          gameTitle={this.state.gameTitle}
          gameCoverUrl={this.state.gameCoverUrl}
          gameStillCoverUrl={this.state.gameStillCoverUrl}
          target={target}
          channel={channel}
          src={src}
          userVersion={userVersion}
          hidden={isNewChannel ? hidden : false}
          pendingPushConfirm={pendingPushConfirm}
          onSetPendingPushConfirm={this.setPendingPushConfirm}
          onPushStarted={this.onPushStarted}
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
   *  push-confirm step. Called from preview-affecting field-change handlers
   *  so a stale comparison or stale "I confirmed" state can never be acted
   *  on for source changes, and on unmount so closing the modal mid-preview
   *  doesn't leak a worker. */
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

  onPushStarted = () => {
    const { dispatch, onUploadPage } = this.props;
    if (!onUploadPage) {
      dispatch(
        actions.navigate({
          wind: ambientWind(),
          url: "itch://upload",
        })
      );
    }
    this.close();
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
        // The set is per-target; drop it so the next target's load resets
        // the new-channel detection cleanly.
        existingChannels: null,
        hidden: false,
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
      existingChannels: null,
      hidden: false,
    });
  };

  handleChannelChange = (channel: string | null) => {
    this.discardPreview();
    // Reset the hidden toggle on every channel switch — its applicability
    // depends on whether the new channel is brand-new, and conservatively
    // turning it off avoids leaking a stale "hide" intent across edits.
    this.setState({ channel, hidden: false });
  };

  handleSrcChange = (src: string | null) => {
    this.discardPreview();
    this.setState({ src });
  };

  handleUserVersionChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ userVersion: ev.target.value });
  };

  handleHiddenChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ hidden: ev.target.checked });
  };

  handleExistingChannels = (names: ReadonlySet<string> | null) => {
    this.setState({ existingChannels: names });
  };
}

export default hook<MappedProps>((map) => ({
  profile: map((rs: RootState) => rs.profile?.profile ?? null),
  preview: map((rs: RootState) => rs.upload.currentPreview ?? null),
  onUploadPage: map((rs: RootState) => {
    const tab = ambientNavigation(rs).tab;
    const instance = rs.winds[ambientWind()].tabInstances[tab];
    return instance?.location?.internalPage === "upload";
  }),
}))(PushBuild as any);
