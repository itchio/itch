import { Build, BuildState } from "common/butlerd/messages";
import { PushJob } from "common/types";
import React from "react";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 80%;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;

  &.live {
    background: rgba(80, 180, 80, 0.18);
    color: #7fd17f;
  }

  &.processing {
    background: rgba(80, 140, 200, 0.22);
    color: #87b7e6;
  }

  &.pushing {
    background: rgba(80, 140, 200, 0.22);
    color: #87b7e6;
  }

  &.failed {
    background: rgba(200, 80, 80, 0.2);
    color: #e07b7b;
  }

  &.inactive {
    background: rgba(255, 255, 255, 0.06);
    color: #9aa0a6;
  }
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
`;

interface Props {
  /** The build behind the row, if any. Synthetic in-flight rows have no build. */
  build?: Build;
  /** The matching push job from Redux (target+channel match), if any. */
  pushJob: PushJob | null;
}

export default class StatusPill extends React.PureComponent<Props> {
  override render() {
    const { build, pushJob } = this.props;

    if (pushJob && pushJob.status === "pushing") {
      const pct = Math.round((pushJob.progress ?? 0) * 100);
      return (
        <Pill className="pushing">
          <Dot />
          {T(_("upload.status.pushing"))} · {pct}%
        </Pill>
      );
    }

    if (!build) {
      // No build, no push job — nothing to render.
      return null;
    }

    switch (build.state) {
      case BuildState.Completed: {
        const isHead =
          build.upload != null && build.upload.buildId === build.id;
        if (!isHead) {
          return (
            <Pill
              className="inactive"
              data-rh={JSON.stringify(_("upload.status.inactive_hint"))}
              data-rh-at="top"
            >
              <Dot />
              {T(_("upload.status.inactive"))}
            </Pill>
          );
        }
        return (
          <Pill className="live">
            <Dot />
            {T(_("upload.status.live"))}
          </Pill>
        );
      }
      case BuildState.Failed:
        return (
          <Pill className="failed">
            <Dot />
            {T(_("upload.status.failed"))}
          </Pill>
        );
      case BuildState.Processing:
      case BuildState.Started:
      default:
        return (
          <Pill className="processing">
            <Dot />
            {T(_("upload.status.processing"))}
          </Pill>
        );
    }
  }
}
