import {
  PublishPushComparison,
  PublishPushPreviewEntry,
  PublishPushTopChangedFiles,
} from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import React from "react";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Header = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: 95%;
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 12px;

  .source-size {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
  }
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  font: inherit;
  color: inherit;
  text-align: left;

  &.new {
    background: rgba(80, 180, 80, 0.12);
    border-color: rgba(80, 180, 80, 0.3);
  }
  &.modified {
    background: rgba(80, 140, 220, 0.12);
    border-color: rgba(80, 140, 220, 0.3);
  }
  &.deleted {
    background: rgba(200, 80, 80, 0.12);
    border-color: rgba(200, 80, 80, 0.3);
  }

  &.clickable {
    cursor: pointer;
    transition: border-color 0.1s ease, background 0.1s ease;

    &:not(.disabled):hover {
      border-color: rgba(255, 255, 255, 0.25);
    }
  }

  &.disabled {
    cursor: default;
    opacity: 0.5;
  }

  &.active {
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.35) inset;
  }
`;

const StatLine = styled.div`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 10px;
`;

const Count = styled.div`
  font-size: 140%;
  font-weight: 600;
  color: ${(props) => props.theme.baseText};
  font-variant-numeric: tabular-nums;
  line-height: 1;
`;

const Label = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: 95%;
`;

const Bytes = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: 90%;
  font-variant-numeric: tabular-nums;
`;

const FreshNote = styled.div`
  color: ${(props) => props.theme.baseText};
  font-size: 95%;
`;

const ChangedFilesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
`;

const ChangedFilesHeader = styled.div`
  color: ${(props) => props.theme.secondaryText};
  text-transform: uppercase;
  font-size: 75%;
  letter-spacing: 0.05em;
`;

const ChangedFilesList = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 4px;
  overflow: hidden;
`;

const ChangedFileRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  font-size: 92%;
  line-height: 1.3;

  &:last-child {
    border-bottom: 0;
  }

  &:nth-child(even) {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 78%;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;

  &.new {
    background: rgba(80, 180, 80, 0.18);
    color: rgba(180, 255, 180, 0.95);
  }
  &.modified {
    background: rgba(80, 140, 220, 0.18);
    color: rgba(180, 210, 255, 0.95);
  }
  &.deleted {
    background: rgba(200, 80, 80, 0.18);
    color: rgba(255, 180, 180, 0.95);
  }
`;

const ChangedPath = styled.span`
  flex: 1;
  min-width: 0;
  font-family: monospace;
  color: ${(props) => props.theme.baseText};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  direction: rtl; /* keep filename visible when path is long */
  text-align: left;
`;

const ChangedSize = styled.span`
  color: ${(props) => props.theme.secondaryText};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
`;

type ChangedFilter = "new" | "modified" | "deleted";

interface Props {
  hasParent: boolean;
  parentBuildId: number;
  sourceSize: number;
  comparison: PublishPushComparison;
  topChangedFiles: PublishPushTopChangedFiles;
}

interface State {
  filter: ChangedFilter | null;
}

class PreviewSummary extends React.PureComponent<Props, State> {
  override state: State = { filter: null };

  // Memoized merged "all" list. Recomputed only when the input arrays
  // change identity — they swap atomically on previewDone, so identity
  // checks are sufficient.
  private mergedCacheKey:
    | [
        PublishPushPreviewEntry[],
        PublishPushPreviewEntry[],
        PublishPushPreviewEntry[]
      ]
    | null = null;
  private mergedCacheValue: PublishPushPreviewEntry[] = [];

  override render() {
    const {
      hasParent,
      parentBuildId,
      sourceSize,
      comparison,
      topChangedFiles,
    } = this.props;

    if (!hasParent) {
      const totalFiles = comparison.new + comparison.same;
      return (
        <Wrapper>
          <Header>
            <span>{T(_("upload.preview.first_build"))}</span>
            <span className="source-size">
              {T([
                "upload.preview.source_size",
                { size: fileSize(sourceSize) },
              ])}
            </span>
          </Header>
          <FreshNote>
            {T([
              "upload.preview.files_to_upload",
              { count: totalFiles, size: fileSize(comparison.newBytes) },
            ])}
          </FreshNote>
          {this.renderChangedFiles(topChangedFiles)}
        </Wrapper>
      );
    }

    // If a filter is set but its category has no entries (e.g. user
    // re-previewed onto data with no deletions while the DELETED filter
    // was active), treat it as no filter so the stale highlight clears
    // and the merged list shows up instead of an empty section.
    const { filter } = this.state;
    const effectiveFilter = filter && comparison[filter] > 0 ? filter : null;
    return (
      <Wrapper>
        <Header>
          <span>{T(["upload.preview.compared_to", { parentBuildId }])}</span>
          <span className="source-size">
            {T(["upload.preview.source_size", { size: fileSize(sourceSize) }])}
          </span>
        </Header>
        <Stats>
          {this.renderFilterStat(
            "new",
            comparison.new,
            comparison.newBytes,
            "+",
            "upload.preview.new",
            effectiveFilter
          )}
          {this.renderFilterStat(
            "modified",
            comparison.modified,
            comparison.modifiedBytes,
            "~",
            "upload.preview.modified",
            effectiveFilter
          )}
          {this.renderFilterStat(
            "deleted",
            comparison.deleted,
            comparison.deletedBytes,
            "−",
            "upload.preview.deleted",
            effectiveFilter
          )}
          <Stat>
            <StatLine>
              <Count>·{comparison.same}</Count>
              <Label>{T(_("upload.preview.same"))}</Label>
            </StatLine>
            <Bytes>{fileSize(comparison.sameBytes)}</Bytes>
          </Stat>
        </Stats>
        {this.renderChangedFiles(topChangedFiles, effectiveFilter)}
      </Wrapper>
    );
  }

  renderFilterStat(
    category: ChangedFilter,
    count: number,
    bytes: number,
    countPrefix: string,
    labelKey: string,
    effectiveFilter: ChangedFilter | null
  ) {
    const empty = count === 0;
    const active = effectiveFilter === category;
    const classes = [category, "clickable"];
    if (empty) {
      classes.push("disabled");
    }
    if (active) {
      classes.push("active");
    }
    return (
      <Stat
        as="button"
        type="button"
        className={classes.join(" ")}
        disabled={empty}
        aria-pressed={active}
        onClick={empty ? undefined : () => this.toggleFilter(category)}
      >
        <StatLine>
          <Count>
            {countPrefix}
            {count}
          </Count>
          <Label>{T(_(labelKey))}</Label>
        </StatLine>
        <Bytes>{fileSize(bytes)}</Bytes>
      </Stat>
    );
  }

  toggleFilter = (category: ChangedFilter) => {
    this.setState((prev) => ({
      filter: prev.filter === category ? null : category,
    }));
  };

  renderChangedFiles(
    topChangedFiles: PublishPushTopChangedFiles,
    filter: ChangedFilter | null = null
  ) {
    const list = filter
      ? topChangedFiles[filter]
      : this.mergedTopChangedFiles(topChangedFiles);
    if (!list || list.length === 0) {
      return null;
    }
    return (
      <ChangedFilesSection>
        <ChangedFilesHeader>{T(_(headerKey(filter)))}</ChangedFilesHeader>
        <ChangedFilesList>
          {list.map((e) => (
            <ChangedFileRow key={`${e.status}:${e.path}`}>
              <StatusBadge className={e.status}>
                {T(_(`upload.preview.${e.status}`))}
              </StatusBadge>
              <ChangedPath title={e.path}>{e.path}</ChangedPath>
              <ChangedSize>{fileSize(e.size)}</ChangedSize>
            </ChangedFileRow>
          ))}
        </ChangedFilesList>
      </ChangedFilesSection>
    );
  }

  mergedTopChangedFiles(
    topChangedFiles: PublishPushTopChangedFiles
  ): PublishPushPreviewEntry[] {
    const key: [
      PublishPushPreviewEntry[],
      PublishPushPreviewEntry[],
      PublishPushPreviewEntry[]
    ] = [
      topChangedFiles.new,
      topChangedFiles.modified,
      topChangedFiles.deleted,
    ];
    if (
      this.mergedCacheKey &&
      this.mergedCacheKey[0] === key[0] &&
      this.mergedCacheKey[1] === key[1] &&
      this.mergedCacheKey[2] === key[2]
    ) {
      return this.mergedCacheValue;
    }
    // Same (size desc, path asc) tie-breaker butler uses, so the merged
    // top-20 is identical to a server-side merge.
    const merged = [...key[0], ...key[1], ...key[2]]
      .sort((a, b) => b.size - a.size || a.path.localeCompare(b.path))
      .slice(0, 20);
    this.mergedCacheKey = key;
    this.mergedCacheValue = merged;
    return merged;
  }
}

function headerKey(filter: ChangedFilter | null): string {
  switch (filter) {
    case "new":
      return "upload.preview.top_changed_files_new";
    case "modified":
      return "upload.preview.top_changed_files_modified";
    case "deleted":
      return "upload.preview.top_changed_files_deleted";
    default:
      return "upload.preview.top_changed_files";
  }
}

export default PreviewSummary;
