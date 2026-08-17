import { actions } from "common/actions";
import { PushJob } from "common/types";
import React from "react";
import { useAppDispatch } from "renderer/hooks/redux";
import {
  ExpandedLabel,
  ExpandedSection,
} from "renderer/pages/UploadPage/BuildRow/styles";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const ErrorBlock = styled.pre`
  margin: 0;
  padding: 8px 10px;
  max-height: 240px;
  overflow: auto;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
  font-family: monospace;
  font-size: 90%;
  white-space: pre-wrap;
  word-break: break-word;
  color: ${(props) => props.theme.baseText};
`;

const ErrorActions = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
`;

const DismissButton = styled.button`
  background: transparent;
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 3px;
  color: ${(props) => props.theme.baseText};
  padding: 6px 12px;
  cursor: pointer;
  font: inherit;

  &:hover {
    background: rgba(255, 255, 255, 0.04);
  }
`;

const PushError = ({ job }: { job: PushJob }) => {
  const dispatch = useAppDispatch();

  const handleDismiss = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    dispatch(actions.dismissPushJob({ jobId: job.id }));
  };

  const labelKey =
    job.status === "cancelled"
      ? "upload.expanded.cancelled"
      : "upload.expanded.error";
  return (
    <ExpandedSection>
      <ExpandedLabel>{T(_(labelKey))}</ExpandedLabel>
      {job.message ? <ErrorBlock>{job.message}</ErrorBlock> : null}
      <ErrorActions>
        <DismissButton onClick={handleDismiss}>
          {T(_("upload.dismiss"))}
        </DismissButton>
      </ErrorActions>
    </ExpandedSection>
  );
};

export default PushError;
