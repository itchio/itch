import { actions } from "common/actions";
import { Build } from "common/butlerd/messages";
import { PushJob } from "common/types";
import React from "react";
import Icon from "renderer/basics/Icon";
import { useAppDispatch } from "renderer/hooks/redux";
import BuildFileTag from "renderer/pages/UploadPage/BuildRow/BuildFileTag";
import PushError from "renderer/pages/UploadPage/BuildRow/PushError";
import PushProgress from "renderer/pages/UploadPage/BuildRow/PushProgress";
import { RowData } from "renderer/pages/UploadPage/BuildRow/row-data";
import {
  ExpandedLabel,
  ExpandedSection,
} from "renderer/pages/UploadPage/BuildRow/styles";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const Expanded = styled.div`
  padding: 16px 24px 20px 52px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  font-size: 90%;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`;

const ExpandedTopRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 24px;
`;

const ExpandedField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const ExpandedValue = styled.div`
  color: ${(props) => props.theme.baseText};
  word-break: break-word;
`;

const BuildIdValue = styled.button`
  background: transparent;
  border: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
  text-align: left;
`;

const ButlerCommand = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: ${(props) => props.theme.inputBackground};
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 3px;
  font-family: monospace;
  font-size: 90%;
  color: ${(props) => props.theme.baseText};
  margin-top: 4px;
`;

const CommandText = styled.input`
  flex: 1;
  min-width: 0;
  background: transparent;
  border: 0;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  user-select: text;
  cursor: text;
`;

const CopyButton = styled.button`
  background: transparent;
  border: 0;
  color: ${(props) => props.theme.secondaryText};
  cursor: pointer;
  padding: 4px;

  &:hover {
    color: ${(props) => props.theme.baseText};
  }
`;

const FilesRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

function formatPushedAt(date: Date | string | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return "";
  const dateStr = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dateStr} · ${timeStr}`;
}

interface Props {
  build: Build | null;
  pushJob?: PushJob;
  data: RowData;
}

const ExpandedDetails = ({ build, pushJob, data }: Props) => {
  const dispatch = useAppDispatch();

  const copy = (text: string) => {
    dispatch(actions.copyToClipboard({ text }));
  };

  const isTerminal =
    pushJob?.status === "failed" || pushJob?.status === "cancelled";
  // Only show the progress bar while bytes are still flowing — once the
  // push hands off to the server (status="processing"), the upload is
  // done and a stuck 100% bar would just be noise.
  const showProgressBar = pushJob?.status === "pushing";

  return (
    <Expanded>
      <ExpandedTopRow>
        <ExpandedField>
          <ExpandedLabel>{T(_("upload.expanded.filename"))}</ExpandedLabel>
          <ExpandedValue>
            {build?.upload?.filename ?? pushJob?.src ?? "—"}
          </ExpandedValue>
        </ExpandedField>
        <ExpandedField>
          <ExpandedLabel>{T(_("upload.expanded.pushed_by"))}</ExpandedLabel>
          <ExpandedValue>
            {build?.createdAt ? formatPushedAt(build.createdAt) : "—"}
            {build?.user?.username ? (
              <>
                {" · "}
                {T(_("upload.expanded.by_user"))}{" "}
                <strong>{build.user.username}</strong>
              </>
            ) : null}
          </ExpandedValue>
        </ExpandedField>
        <ExpandedField>
          <ExpandedLabel>{T(_("upload.expanded.build_id"))}</ExpandedLabel>
          {build ? (
            <BuildIdValue
              onClick={(ev) => {
                ev.stopPropagation();
                copy(String(build.id));
              }}
            >
              {data.buildIdLabel}
            </BuildIdValue>
          ) : (
            <ExpandedValue>—</ExpandedValue>
          )}
        </ExpandedField>
      </ExpandedTopRow>
      {data.orderedFiles.length > 0 ? (
        <ExpandedSection>
          <ExpandedLabel>{T(_("upload.expanded.files"))}</ExpandedLabel>
          <FilesRow>
            {data.orderedFiles.map((file) => (
              <BuildFileTag
                key={`${file.type}-${file.subType}`}
                file={file}
                parentBuildId={build?.parentBuildId}
              />
            ))}
          </FilesRow>
        </ExpandedSection>
      ) : null}
      <ExpandedSection>
        <ExpandedLabel>{T(_("upload.expanded.butler_command"))}</ExpandedLabel>
        <ButlerCommand>
          <CommandText
            readOnly
            value={data.butlerCmd}
            onClick={(ev) => ev.stopPropagation()}
            spellCheck={false}
          />
          <CopyButton
            onClick={(ev) => {
              ev.stopPropagation();
              copy(data.butlerCmd);
            }}
            title="Copy"
          >
            <Icon icon="copy" />
          </CopyButton>
        </ButlerCommand>
      </ExpandedSection>
      {showProgressBar && pushJob ? <PushProgress job={pushJob} /> : null}
      {isTerminal && pushJob ? <PushError job={pushJob} /> : null}
    </Expanded>
  );
};

export default ExpandedDetails;
