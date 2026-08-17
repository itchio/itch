import {
  BuildFile,
  BuildFileState,
  BuildFileSubType,
  BuildFileType,
} from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import React from "react";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const Wrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: ${(props) => props.theme.inputBackground};
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 3px;
  font-size: 90%;
  color: ${(props) => props.theme.baseText};

  &.muted {
    opacity: 0.5;
  }

  &.failed {
    border-color: rgba(200, 80, 80, 0.4);
    color: #e07b7b;
  }
`;

const TypeLabel = styled.span`
  font-weight: 600;
`;

const Meta = styled.span`
  color: ${(props) => props.theme.secondaryText};
`;

interface Props {
  file: BuildFile;
  /** parentBuildId of the build the file belongs to, if any */
  parentBuildId?: number;
}

const BuildFileTag = ({ file, parentBuildId }: Props) => {
  const failed = file.state === BuildFileState.Failed;
  const pending =
    file.state === BuildFileState.Created ||
    file.state === BuildFileState.Uploading;
  const className = failed ? "failed" : pending ? "muted" : "";
  const isOptimizedPatch =
    file.type === BuildFileType.Patch &&
    file.subType === BuildFileSubType.Optimized;
  // Optimized patches and archives for a build with a parent are generated
  // on a remote server, not uploaded directly by the user, so report them
  // as "processing" rather than "uploading".
  const serverProcessed =
    (parentBuildId ?? -1) > 0 &&
    (isOptimizedPatch || file.type === BuildFileType.Archive);
  const meta: string[] = [];
  if (file.size > 0) meta.push(fileSize(file.size));
  if (file.state !== BuildFileState.Uploaded) {
    meta.push(serverProcessed && pending ? "processing" : file.state);
  }
  const typeSuffix = isOptimizedPatch ? "patch_optimized" : file.type;
  const typeKey = `upload.file_type.${typeSuffix}`;
  const hintKey = `upload.file_type.${typeSuffix}_hint`;
  return (
    <Wrapper
      className={className}
      data-rh={JSON.stringify(_(hintKey))}
      data-rh-at="top"
    >
      <TypeLabel>{T(_(typeKey))}</TypeLabel>
      {meta.length > 0 ? <Meta>· {meta.join(" · ")}</Meta> : null}
    </Wrapper>
  );
};

export default BuildFileTag;
