import { lighten, transparentize } from "polished";
import { actions } from "common/actions";
import { Dispatch, PreviewState, RootState } from "common/types";
import React from "react";
import Button from "renderer/basics/Button";
import Icon from "renderer/basics/Icon";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { hookWithProps } from "renderer/hocs/hook";
import PreviewSummary from "renderer/modal-widgets/PushBuild/PreviewSummary";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const Wrapper = styled.div`
  margin-top: 20px;
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 4px;
  background: ${(props) => props.theme.itemBackground};
  padding: 18px 20px;
  min-height: 72px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  color: ${(props) => props.theme.secondaryText};
  text-transform: uppercase;
  font-size: 75%;
  letter-spacing: 0.05em;
  margin-bottom: 14px;
`;

const Placeholder = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: 95%;
`;

const ProgressRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;

  .progress-text {
    flex: 1;
    color: ${(props) => props.theme.baseText};
  }
`;

const Banner = styled.div`
  padding: 10px 14px;
  border-radius: 3px;
  line-height: 1.4;

  &.bad {
    background: rgba(180, 80, 80, 0.18);
    color: ${(props) => props.theme.baseText};
  }
  &.muted {
    background: rgba(255, 255, 255, 0.04);
    color: ${(props) => props.theme.secondaryText};
  }

  pre {
    margin: 8px 0 0;
    padding: 8px 10px;
    max-height: 240px;
    overflow: auto;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 3px;
    font-family: monospace;
    font-size: 90%;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

const ConfirmCallout = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 4px;
  background: ${(props) => transparentize(0.88, props.theme.caution)};
  border: 1px solid ${(props) => transparentize(0.65, props.theme.caution)};
  color: ${(props) => props.theme.baseText};
  line-height: 1.45;

  .icon {
    color: ${(props) => lighten(0.08, props.theme.caution)};
    /* Nudge the icon to sit on the cap line of the first text line. */
    margin-top: 2px;
    font-size: 110%;
  }
`;

interface OwnProps {
  /** Set when the user clicked Push without a successful preview. The
   *  panel surfaces a callout in the otherwise-idle slot so the second
   *  click feels deliberate, not buried. */
  pendingPushConfirm: boolean;
}

interface MappedProps {
  preview: PreviewState | null;
  dispatch: Dispatch;
}

type Props = OwnProps & MappedProps;

class ReviewPanel extends React.PureComponent<Props> {
  override render() {
    const { preview, pendingPushConfirm } = this.props;

    return (
      <Wrapper>
        <Header>{T(_("upload.preview.header"))}</Header>
        {this.renderBody(preview, pendingPushConfirm)}
      </Wrapper>
    );
  }

  renderBody(preview: PreviewState | null, pendingPushConfirm: boolean) {
    if (preview) {
      if (preview.status === "running") {
        const pct = Math.round(preview.progress * 100);
        return (
          <ProgressRow>
            <LoadingCircle progress={preview.progress} />
            <span className="progress-text">
              {T(_("upload.preview.running"))} {pct}%
            </span>
            <Button onClick={this.handleCancelPreview}>
              {T(_("upload.cancel"))}
            </Button>
          </ProgressRow>
        );
      }
      if (
        preview.status === "done" &&
        preview.comparison !== undefined &&
        preview.hasParent !== undefined &&
        preview.sourceSize !== undefined &&
        preview.topChangedFiles !== undefined
      ) {
        return (
          <PreviewSummary
            hasParent={preview.hasParent}
            // parentBuildId is only meaningful (and only read) when
            // hasParent is true; the wire contract omits it otherwise.
            parentBuildId={preview.parentBuildId ?? 0}
            sourceSize={preview.sourceSize}
            comparison={preview.comparison}
            topChangedFiles={preview.topChangedFiles}
          />
        );
      }
      if (preview.status === "failed") {
        return (
          <Banner className="bad">
            {T(_("upload.preview.failed"))}
            {preview.message ? <pre>{preview.message}</pre> : null}
          </Banner>
        );
      }
      if (preview.status === "cancelled") {
        return (
          <Banner className="muted">{T(_("upload.preview.cancelled"))}</Banner>
        );
      }
    }

    if (pendingPushConfirm) {
      return (
        <ConfirmCallout>
          <Icon icon="warning" />
          <span>{T(_("upload.preview.push_confirm_callout"))}</span>
        </ConfirmCallout>
      );
    }

    return <Placeholder>{T(_("upload.preview.placeholder"))}</Placeholder>;
  }

  handleCancelPreview = () => {
    const { preview, dispatch } = this.props;
    if (preview && preview.status === "running") {
      dispatch(actions.cancelPreview({ id: preview.id }));
    }
  };
}

export default hookWithProps(ReviewPanel)((map) => ({
  preview: map((rs, _props: OwnProps) => rs.upload.currentPreview ?? null),
}))(ReviewPanel);
