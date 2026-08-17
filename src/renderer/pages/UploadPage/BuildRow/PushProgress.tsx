import { fileSize } from "common/format/filesize";
import { PushJob } from "common/types";
import React from "react";
import { ExpandedSection } from "renderer/pages/UploadPage/BuildRow/styles";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const ProgressBarWrap = styled.div`
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  background: ${(props) => props.theme.accent};
  transition: width 0.2s ease;
`;

const ProgressHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
`;

const ProgressPhase = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.baseText};
`;

const ProgressMeta = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: 90%;
`;

const ProgressBreakdown = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  flex-wrap: wrap;
  color: ${(props) => props.theme.secondaryText};
  font-size: 90%;
`;

const ProgressStat = styled.span`
  & > strong {
    color: ${(props) => props.theme.baseText};
    font-weight: 600;
  }
`;

function pushPhaseKey(job: PushJob): string {
  const {
    readBytes = 0,
    totalBytes = 0,
    uploadedBytes = 0,
    patchBytes = 0,
  } = job;
  if (totalBytes === 0 && readBytes === 0) {
    return "upload.progress.phase.preparing";
  }
  if (totalBytes > 0 && readBytes < totalBytes) {
    return "upload.progress.phase.diffing";
  }
  if (patchBytes > 0 && uploadedBytes < patchBytes) {
    return "upload.progress.phase.uploading";
  }
  return "upload.progress.phase.finishing";
}

function formatBps(bps: number | undefined): string {
  if (!bps || bps <= 0) return "";
  return `${fileSize(bps)}/s`;
}

function formatEta(eta: number | undefined): string {
  if (!eta || eta <= 0) return "";
  if (eta < 60) return `${Math.round(eta)}s`;
  const m = Math.floor(eta / 60);
  const s = Math.round(eta % 60);
  return `${m}m ${s}s`;
}

const PushProgress = ({ job }: { job: PushJob }) => {
  const phaseKey = pushPhaseKey(job);
  const pct = Math.round((job.progress ?? 0) * 100);
  const bpsText = formatBps(job.bps);
  const etaText = formatEta(job.eta);
  const metaParts: React.ReactNode[] = [];
  if (bpsText) metaParts.push(bpsText);
  if (etaText) {
    metaParts.push(T(["upload.progress.eta", { eta: etaText }]));
  }

  const hasReadStats = (job.totalBytes ?? 0) > 0;
  const hasUploadStats =
    (job.uploadedBytes ?? 0) > 0 || (job.patchBytes ?? 0) > 0;

  return (
    <ExpandedSection>
      <ProgressHeader>
        <ProgressPhase>
          {T(_(phaseKey))} · {pct}%
        </ProgressPhase>
        {metaParts.length > 0 ? (
          <ProgressMeta>
            {metaParts.map((part, i) => (
              <React.Fragment key={i}>
                {i > 0 ? " · " : null}
                {part}
              </React.Fragment>
            ))}
          </ProgressMeta>
        ) : null}
      </ProgressHeader>
      <ProgressBarWrap>
        <ProgressBarFill style={{ width: `${pct}%` }} />
      </ProgressBarWrap>
      {hasReadStats || hasUploadStats ? (
        <ProgressBreakdown>
          {hasReadStats ? (
            <ProgressStat>
              {T(_("upload.progress.read"))}{" "}
              <strong>
                {fileSize(job.readBytes ?? 0)} / {fileSize(job.totalBytes!)}
              </strong>
            </ProgressStat>
          ) : null}
          {hasUploadStats ? (
            <ProgressStat>
              {T(_("upload.progress.uploaded"))}{" "}
              <strong>{fileSize(job.uploadedBytes ?? 0)}</strong>
              {(job.patchBytes ?? 0) > 0 ? (
                <>
                  {" "}
                  {T([
                    "upload.progress.patch_size",
                    { size: fileSize(job.patchBytes!) },
                  ])}
                </>
              ) : null}
            </ProgressStat>
          ) : null}
        </ProgressBreakdown>
      ) : null}
    </ExpandedSection>
  );
};

export default PushProgress;
