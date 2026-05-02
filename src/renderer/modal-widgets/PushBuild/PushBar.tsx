import { darken, lighten } from "polished";
import React from "react";
import { actions } from "common/actions";
import { Dispatch, PreviewState, RootState } from "common/types";
import uuid from "common/util/uuid";
import Button from "renderer/basics/Button";
import { hookWithProps } from "renderer/hocs/hook";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";
import rng from "renderer/util/rng";

const Wrapper = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;

  > .push-button {
    margin-left: auto;
  }

  /* Confirm-needed state on the Push button: amber wash so it reads as
   *  "you're confirming a non-default action" instead of "primary push". */
  > .push-button.confirming {
    background-image: linear-gradient(
      10deg,
      ${(props) => darken(0.18, props.theme.caution)},
      ${(props) => props.theme.caution}
    );
    border-color: ${(props) => lighten(0.08, props.theme.caution)};
  }
`;

interface OwnProps {
  gameId: number | null;
  /** Snapshot fields from the picked game, forwarded into startPush so the
   *  synthetic in-flight row in the dashboard can render the project. */
  gameTitle: string | null;
  gameCoverUrl: string | null;
  gameStillCoverUrl: string | null;
  /** wharf target in user/slug form, or null if not ready */
  target: string | null;
  channel: string | null;
  src: string | null;
  /** True after a first Push click without a successful preview backing
   *  the form. Lifted to the dialog so ReviewPanel can show a matching
   *  warning. */
  pendingPushConfirm: boolean;
  onSetPendingPushConfirm: (v: boolean) => void;
  /** Optional: called after a successful startPush dispatch. The modal
   *  uses this to close itself once the push is in flight; the dashboard
   *  takes over showing live progress on the matching row. */
  onPushStarted?: () => void;
}

interface MappedProps {
  preview: PreviewState | null;
  dispatch: Dispatch;
}

type Props = OwnProps & MappedProps;

class PushBar extends React.PureComponent<Props> {
  override render() {
    const { preview, gameId, target, channel, src, pendingPushConfirm } =
      this.props;
    const fieldsReady = !!(gameId && target && channel && src);
    const previewRunning = preview?.status === "running";

    const previewDisabled = !fieldsReady || previewRunning;
    const pushDisabled = !fieldsReady || previewRunning;

    const previewBackingPush = preview?.status === "done";
    const confirming = pendingPushConfirm && !previewBackingPush;

    return (
      <Wrapper>
        <Button
          className="preview-button"
          icon="visibility"
          disabled={previewDisabled}
          onClick={this.handlePreview}
        >
          {T(_("upload.preview"))}
        </Button>
        <Button
          className={confirming ? "push-button confirming" : "push-button"}
          primary={!confirming}
          icon={confirming ? "warning" : "upload"}
          disabled={pushDisabled}
          onClick={this.handlePush}
        >
          {T(_(confirming ? "upload.push_without_preview" : "upload.push"))}
        </Button>
      </Wrapper>
    );
  }

  handlePreview = () => {
    const { dispatch, target, channel, src, onSetPendingPushConfirm } =
      this.props;
    if (!target || !channel || !src) return;
    // Taking the safe path clears the confirm-step regardless of whether
    // the preview ultimately succeeds — the user has signalled intent.
    onSetPendingPushConfirm(false);
    dispatch(
      actions.startPreview({
        id: uuid(rng),
        target,
        channel,
        src,
      })
    );
  };

  handlePush = () => {
    const {
      dispatch,
      gameId,
      gameTitle,
      gameCoverUrl,
      gameStillCoverUrl,
      target,
      channel,
      src,
      preview,
      pendingPushConfirm,
      onSetPendingPushConfirm,
      onPushStarted,
    } = this.props;
    if (!gameId || !target || !channel || !src) return;

    // Two-click confirm: the first click lights up the warning state in
    // the Review panel + relabels this button. Form-edits / Preview-click
    // / preview-completion all reset pendingPushConfirm in the dialog, so
    // the confirm decision can't go stale.
    const previewBackingPush = preview?.status === "done";
    if (!previewBackingPush && !pendingPushConfirm) {
      onSetPendingPushConfirm(true);
      return;
    }

    dispatch(
      actions.startPush({
        jobId: uuid(rng),
        createdAt: Date.now(),
        gameId,
        gameTitle: gameTitle ?? undefined,
        gameCoverUrl: gameCoverUrl ?? undefined,
        gameStillCoverUrl: gameStillCoverUrl ?? undefined,
        target,
        channel,
        src,
      })
    );
    onPushStarted?.();
  };
}

export default hookWithProps(PushBar)((map) => ({
  preview: map(
    (rs: RootState, _props: OwnProps) => rs.upload.currentPreview ?? null
  ),
}))(PushBar);
