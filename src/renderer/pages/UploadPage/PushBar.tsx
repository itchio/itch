import React from "react";
import { actions } from "common/actions";
import { selectActivePushJob } from "common/reducers/upload";
import { Dispatch, PushJob, RootState } from "common/types";
import uuid from "common/util/uuid";
import Button from "renderer/basics/Button";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";
import rng from "renderer/util/rng";

const Wrapper = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;

  > .button {
    margin-left: auto;
  }
`;

const Status = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  color: ${(props) => props.theme.secondaryText};
`;

const Result = styled.div`
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 3px;

  &.ok {
    background: rgba(80, 180, 80, 0.15);
    color: ${(props) => props.theme.baseText};
  }
  &.bad {
    background: rgba(180, 80, 80, 0.18);
    color: ${(props) => props.theme.baseText};
  }
`;

interface OwnProps {
  gameId: number | null;
  /** wharf target in user/slug form, or null if not ready */
  target: string | null;
  channel: string | null;
  src: string | null;
}

interface MappedProps {
  activeJob: PushJob | null;
  latestResult: PushJob | null;
  dispatch: Dispatch;
}

type Props = OwnProps & MappedProps;

class PushBar extends React.PureComponent<Props> {
  override render() {
    const { activeJob, latestResult, gameId, target, channel, src } =
      this.props;
    const ready = !!(gameId && target && channel && src);

    return (
      <>
        <Wrapper>
          {activeJob ? (
            <>
              <Status>
                <LoadingCircle progress={activeJob.progress} />
                <span>
                  {Math.round(activeJob.progress * 100)}%
                  {activeJob.label ? ` · ${activeJob.label}` : ""}
                </span>
              </Status>
              <Button className="button" onClick={this.handleCancel}>
                {T(_("upload.cancel"))}
              </Button>
            </>
          ) : (
            <Button
              className="button"
              primary
              icon="upload"
              disabled={!ready}
              onClick={this.handlePush}
            >
              {T(_("upload.push"))}
            </Button>
          )}
        </Wrapper>
        {latestResult && !activeJob ? (
          <Result
            className={latestResult.status === "processing" ? "ok" : "bad"}
          >
            {latestResult.status === "processing"
              ? T(["upload.success", { channel: latestResult.channel }])
              : T([
                  "upload.failed",
                  {
                    channel: latestResult.channel,
                    message: latestResult.message ?? "",
                  },
                ])}
          </Result>
        ) : null}
      </>
    );
  }

  handlePush = () => {
    const { dispatch, gameId, target, channel, src } = this.props;
    if (!gameId || !target || !channel || !src) return;
    dispatch(
      actions.startPush({
        jobId: uuid(rng),
        createdAt: Date.now(),
        gameId,
        target,
        channel,
        src,
      })
    );
  };

  handleCancel = () => {
    const { activeJob, dispatch } = this.props;
    if (activeJob) {
      dispatch(actions.cancelPush({ jobId: activeJob.id }));
    }
  };
}

function getLatestResult(rs: RootState): PushJob | null {
  for (const jobId of rs.upload.jobOrder) {
    const job = rs.upload.jobs[jobId];
    if (job && job.status !== "pushing") {
      return job;
    }
  }
  return null;
}

export default hook((map) => ({
  activeJob: map((rs) => selectActivePushJob(rs.upload)),
  latestResult: map(getLatestResult),
}))(PushBar);
