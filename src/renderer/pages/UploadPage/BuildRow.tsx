import { actions } from "common/actions";
import {
  Build,
  BuildFile,
  BuildFileState,
  BuildFileSubType,
  BuildFileType,
  Game,
  Platforms,
  Upload,
} from "common/butlerd/messages";
import platformData from "common/constants/platform-data";
import { fileSize } from "common/format/filesize";
import { Dispatch, MenuTemplate, PushJob } from "common/types";
import { ambientWind, urlForGame } from "common/util/navigation";
import modals from "renderer/modals";
import React from "react";
import Icon from "renderer/basics/Icon";
import TimeAgo from "renderer/basics/TimeAgo";
import { hook } from "renderer/hocs/hook";
import { targetForGame } from "renderer/modal-widgets/PushBuild/target";
import StatusPill from "renderer/pages/UploadPage/StatusPill";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";

const Row = styled.div`
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.itemBackground};
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: 24px 2fr 1.4fr 1fr 1fr 0.8fr 0.8fr 32px;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
`;

const Caret = styled.button`
  width: 24px;
  height: 24px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.theme.secondaryText};
  cursor: pointer;
  transform: rotate(-90deg);
  transition: transform 0.15s ease;

  &.open {
    transform: rotate(0deg);
  }
`;

const Project = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  min-width: 0;
`;

const ProjectChip = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background: ${(props) => props.theme.sidebarBackground};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 80%;
  font-weight: 600;
  color: ${(props) => props.theme.baseText};
  flex-shrink: 0;
  overflow: hidden;
`;

const ProjectCoverImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const ProjectText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 4px;
`;

const ProjectTitle = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.baseText};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
`;

const ProjectSlug = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: 85%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
`;

const Channel = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: ${(props) => props.theme.inputBackground};
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 3px;
  font-family: monospace;
  font-size: 90%;
  color: ${(props) => props.theme.baseText};
  width: max-content;
  max-width: 100%;
  cursor: pointer;
`;

const Version = styled.div`
  display: flex;
  flex-direction: column;
`;

const VersionLine = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.baseText};
  line-height: 1.2;
`;

const Cell = styled.div`
  color: ${(props) => props.theme.secondaryText};
`;

const SizeCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: ${(props) => props.theme.secondaryText};
`;

const SizePrimary = styled.div`
  line-height: 1.2;
`;

const SizeSecondary = styled.div`
  font-size: 85%;
  color: ${(props) => props.theme.secondaryText};
  opacity: 0.75;
  line-height: 1.2;
`;

const Kebab = styled.button`
  background: transparent;
  border: 0;
  color: ${(props) => props.theme.secondaryText};
  cursor: pointer;
  padding: 4px;
  border-radius: 2px;

  &:hover {
    color: ${(props) => props.theme.baseText};
    background: rgba(255, 255, 255, 0.05);
  }
`;

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

const ExpandedSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ExpandedLabel = styled.div`
  color: ${(props) => props.theme.secondaryText};
  text-transform: uppercase;
  font-size: 75%;
  letter-spacing: 0.05em;
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

const ProgressBarWrap = styled.div`
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
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

const FilesRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
`;

const FileChip = styled.div`
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

const FileChipType = styled.span`
  font-weight: 600;
`;

const FileChipMeta = styled.span`
  color: ${(props) => props.theme.secondaryText};
`;

const ProgressBarFill = styled.div`
  height: 100%;
  background: ${(props) => props.theme.accent};
  transition: width 0.2s ease;
`;

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

function projectInitials(title: string | undefined): string {
  if (!title) return "?";
  const words = title.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0]! + words[1][0]!).toUpperCase();
  }
  return title.substring(0, 2).toUpperCase();
}

const PLATFORM_KEYS: Array<keyof Platforms> = ["windows", "linux", "osx"];

function platformIcon(platforms: Platforms | undefined): string {
  if (!platforms) return "tag";
  for (const key of PLATFORM_KEYS) {
    if (platforms[key]) return platformData[key].icon;
  }
  return "tag";
}

const BUILD_FILE_TYPE_ORDER: BuildFileType[] = [
  BuildFileType.Archive,
  BuildFileType.Patch,
  BuildFileType.Signature,
  BuildFileType.Manifest,
  BuildFileType.Unpacked,
];

function findBuildFile(
  files: BuildFile[] | undefined,
  type: BuildFileType
): BuildFile | undefined {
  return files?.find((f) => f.type === type);
}

function orderedBuildFiles(files: BuildFile[] | undefined): BuildFile[] {
  if (!files || files.length === 0) return [];
  const out: BuildFile[] = [];
  for (const t of BUILD_FILE_TYPE_ORDER) {
    const f = findBuildFile(files, t);
    if (f) out.push(f);
  }
  for (const f of files) {
    if (!BUILD_FILE_TYPE_ORDER.includes(f.type)) out.push(f);
  }
  return out;
}

function pushPhaseKey(job: PushJob | null): string {
  if (!job) return "upload.progress.phase.preparing";
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

interface OwnProps {
  /** Server-side build, or null when the row is purely a synthetic in-flight push. */
  build: Build | null;
  /** Local push job matching this row. For rows with no server build it
   *  drives every field; for server rows it overlays live progress / a
   *  terminal status that the server hasn't caught up to yet. Match is by
   *  buildId (set by Publish.Push.BuildAssigned), so no risk of attaching
   *  a fresh push to a historical build on the same channel. */
  pushJob?: PushJob;
  tab: string;
  onSetSearch: (search: string) => void;
}

interface MappedProps {
  dispatch: Dispatch;
}

type Props = OwnProps & MappedProps;

interface State {
  expanded: boolean;
}

class BuildRow extends React.PureComponent<Props, State> {
  constructor(props: Props, context: any) {
    super(props, context);
    // Auto-expand only for cases where the user genuinely wants the
    // detail open: synthetic-only rows (no server build, the row IS the
    // job) and actively-uploading overlays. Don't auto-expand for
    // already-handed-off or terminal overlays — re-mounts (search,
    // filter, polling reorders) would otherwise force the row back open
    // every time, even after the user collapsed it.
    this.state = {
      expanded: !props.build || props.pushJob?.status === "pushing",
    };
  }

  override render() {
    const { build, pushJob } = this.props;
    const { expanded } = this.state;

    // Synthetic-only rows (no server build yet) fall back to fields the
    // push modal stashed on the job at dispatch time.
    const game: Game | undefined = build?.game;
    const upload: Upload | undefined = build?.upload;

    const projectTitle = game?.title ?? pushJob?.gameTitle ?? "";
    const projectSlug = game ? targetForGame(game) : pushJob?.target ?? "";
    const projectCoverUrl =
      game?.stillCoverUrl ||
      game?.coverUrl ||
      pushJob?.gameStillCoverUrl ||
      pushJob?.gameCoverUrl ||
      null;
    const channelName = upload?.channelName ?? pushJob?.channel ?? "";
    const target = pushJob?.target ?? projectSlug;
    const userVersion = build?.userVersion?.trim() || null;
    const buildIdLabel = build ? `#${build.id}` : "";
    const archiveFile = findBuildFile(build?.files, BuildFileType.Archive);
    const patchFile = findBuildFile(build?.files, BuildFileType.Patch);
    const archiveSize = archiveFile?.size ?? upload?.size ?? 0;
    const patchSize = patchFile?.size ?? 0;
    const orderedFiles = orderedBuildFiles(build?.files);
    const platforms = upload?.platforms;

    // Push job match is by buildId (set by Publish.Push.BuildAssigned),
    // so server rows can safely overlay live progress / terminal state.
    const activeJob = pushJob ?? null;
    const isTerminal =
      activeJob?.status === "failed" || activeJob?.status === "cancelled";
    // Only show the progress bar while bytes are still flowing — once the
    // push hands off to the server (status="processing"), the upload is
    // done and a stuck 100% bar would just be noise.
    const showProgressBar = activeJob?.status === "pushing";

    const butlerCmd = `butler push <dir> ${target}:${channelName}`;

    return (
      <Row className={expanded ? "expanded" : ""}>
        <Header onClick={this.toggle} onContextMenu={this.handleKebab}>
          <Caret
            type="button"
            className={expanded ? "open" : ""}
            onClick={this.handleCaretClick}
            aria-expanded={expanded}
            aria-label={
              expanded ? "Collapse build details" : "Expand build details"
            }
          >
            <Icon icon="caret-down" />
          </Caret>
          <Project>
            <ProjectChip>
              {projectCoverUrl ? (
                <ProjectCoverImg src={projectCoverUrl} alt={projectTitle} />
              ) : (
                projectInitials(projectTitle)
              )}
            </ProjectChip>
            <ProjectText>
              <ProjectTitle>{projectTitle || "—"}</ProjectTitle>
              <ProjectSlug>{projectSlug}</ProjectSlug>
            </ProjectText>
          </Project>
          <Channel onClick={this.handleChannelClick} disabled={!channelName}>
            {platforms ? <Icon icon={platformIcon(platforms)} /> : null}
            <span>{channelName}</span>
          </Channel>
          <Version>
            <VersionLine>
              {userVersion ?? (build?.version ? `v${build.version}` : "—")}
            </VersionLine>
          </Version>
          <Cell>
            <StatusPill build={build ?? undefined} pushJob={activeJob} />
          </Cell>
          <SizeCell>
            <SizePrimary>
              {archiveSize > 0 ? fileSize(archiveSize) : "—"}
            </SizePrimary>
            {patchSize > 0 ? (
              <SizeSecondary>
                {T([
                  "upload.size.patch_subtext",
                  { size: fileSize(patchSize) },
                ])}
              </SizeSecondary>
            ) : null}
          </SizeCell>
          <Cell>
            {build?.createdAt ? (
              <TimeAgo date={build.createdAt} />
            ) : pushJob ? (
              <TimeAgo date={new Date(pushJob.createdAt)} />
            ) : (
              "—"
            )}
          </Cell>
          <Kebab onClick={this.handleKebab}>
            <Icon icon="more_vert" />
          </Kebab>
        </Header>
        {expanded ? (
          <Expanded>
            <ExpandedTopRow>
              <ExpandedField>
                <ExpandedLabel>
                  {T(_("upload.expanded.filename"))}
                </ExpandedLabel>
                <ExpandedValue>
                  {upload?.filename ?? pushJob?.src ?? "—"}
                </ExpandedValue>
              </ExpandedField>
              <ExpandedField>
                <ExpandedLabel>
                  {T(_("upload.expanded.pushed_by"))}
                </ExpandedLabel>
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
                <ExpandedLabel>
                  {T(_("upload.expanded.build_id"))}
                </ExpandedLabel>
                {build ? (
                  <BuildIdValue onClick={this.handleCopyBuildId}>
                    {buildIdLabel}
                  </BuildIdValue>
                ) : (
                  <ExpandedValue>—</ExpandedValue>
                )}
              </ExpandedField>
            </ExpandedTopRow>
            {orderedFiles.length > 0 ? (
              <ExpandedSection>
                <ExpandedLabel>{T(_("upload.expanded.files"))}</ExpandedLabel>
                <FilesRow>{orderedFiles.map(this.renderFileChip)}</FilesRow>
              </ExpandedSection>
            ) : null}
            <ExpandedSection>
              <ExpandedLabel>
                {T(_("upload.expanded.butler_command"))}
              </ExpandedLabel>
              <ButlerCommand>
                <CommandText
                  readOnly
                  value={butlerCmd}
                  onClick={(ev) => ev.stopPropagation()}
                  spellCheck={false}
                />
                <CopyButton
                  onClick={(ev) => {
                    ev.stopPropagation();
                    this.handleCopyCommand(butlerCmd);
                  }}
                  title="Copy"
                >
                  <Icon icon="copy" />
                </CopyButton>
              </ButlerCommand>
            </ExpandedSection>
            {showProgressBar && activeJob
              ? this.renderProgressSection(activeJob)
              : null}
            {isTerminal && activeJob
              ? this.renderErrorSection(activeJob)
              : null}
          </Expanded>
        ) : null}
      </Row>
    );
  }

  renderErrorSection = (job: PushJob) => {
    const labelKey =
      job.status === "cancelled"
        ? "upload.expanded.cancelled"
        : "upload.expanded.error";
    return (
      <ExpandedSection>
        <ExpandedLabel>{T(_(labelKey))}</ExpandedLabel>
        {job.message ? <ErrorBlock>{job.message}</ErrorBlock> : null}
        <ErrorActions>
          <DismissButton onClick={this.handleDismiss}>
            {T(_("upload.dismiss"))}
          </DismissButton>
        </ErrorActions>
      </ExpandedSection>
    );
  };

  handleDismiss = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    const { pushJob, dispatch } = this.props;
    if (pushJob) {
      dispatch(actions.dismissPushJob({ jobId: pushJob.id }));
    }
  };

  toggle = () => {
    this.setState((s) => ({ expanded: !s.expanded }));
  };

  handleCaretClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    this.toggle();
  };

  renderProgressSection = (job: PushJob) => {
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

  renderFileChip = (file: BuildFile) => {
    const failed = file.state === BuildFileState.Failed;
    const pending =
      file.state === BuildFileState.Created ||
      file.state === BuildFileState.Uploading;
    const className = failed ? "failed" : pending ? "muted" : "";
    const meta: string[] = [];
    if (file.size > 0) meta.push(fileSize(file.size));
    if (file.subType === BuildFileSubType.Optimized) {
      meta.push("optimized");
    }
    if (file.state !== BuildFileState.Uploaded) {
      meta.push(file.state);
    }
    const typeKey = `upload.file_type.${file.type}`;
    const hintKey = `upload.file_type.${file.type}_hint`;
    return (
      <FileChip
        key={`${file.type}-${file.subType}`}
        className={className}
        data-rh={JSON.stringify(_(hintKey))}
        data-rh-at="top"
      >
        <FileChipType>{T(_(typeKey))}</FileChipType>
        {meta.length > 0 ? (
          <FileChipMeta>· {meta.join(" · ")}</FileChipMeta>
        ) : null}
      </FileChip>
    );
  };

  handleKebab = (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    const { build, pushJob, dispatch } = this.props;
    const target =
      pushJob?.target ?? (build?.game ? targetForGame(build.game) : "");
    const channel = pushJob?.channel ?? build?.upload?.channelName ?? "";
    const butlerCmd = `butler push <dir> ${target}:${channel}`;
    const gameId = build?.game?.id ?? pushJob?.gameId;

    const template: MenuTemplate = [];
    if (gameId) {
      if (build?.game) {
        template.push({
          localizedLabel: ["upload.menu.push_new_build"],
          action: actions.openModal(
            modals.pushBuild.make({
              wind: ambientWind(),
              title: "Push new build",
              message: "",
              widgetParams: {
                prefilledGame: build.game,
                prefilledChannel: channel || undefined,
              },
            })
          ),
        });
      }
      template.push({
        localizedLabel: ["upload.menu.view_project"],
        action: actions.navigate({
          wind: ambientWind(),
          url: urlForGame(gameId),
          background: true,
        }),
      });
    }
    template.push({
      localizedLabel: ["upload.menu.copy_command"],
      action: actions.copyToClipboard({ text: butlerCmd }),
    });
    if (build) {
      template.push({
        localizedLabel: ["upload.menu.copy_build_id"],
        action: actions.copyToClipboard({ text: String(build.id) }),
      });
    }

    // Terminal push jobs can be cleared. For synthetic-only rows that
    // removes the row entirely; for overlay rows on a server build it
    // just clears the local error/cancellation overlay (the server build
    // row stays).
    if (
      pushJob &&
      (pushJob.status === "failed" || pushJob.status === "cancelled")
    ) {
      template.push({ type: "separator" });
      template.push({
        localizedLabel: ["upload.menu.remove"],
        action: actions.dismissPushJob({ jobId: pushJob.id }),
      });
    }

    dispatch(
      actions.popupContextMenu({
        wind: ambientWind(),
        clientX: ev.clientX,
        clientY: ev.clientY,
        template,
      })
    );
  };

  handleCopyCommand = (cmd: string) => {
    this.props.dispatch(actions.copyToClipboard({ text: cmd }));
  };

  handleCopyBuildId = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    const { build } = this.props;
    if (build) {
      this.handleCopyCommand(String(build.id));
    }
  };

  handleChannelClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    const channel =
      this.props.build?.upload?.channelName ??
      this.props.pushJob?.channel ??
      "";
    if (!channel) return;
    this.props.onSetSearch(channel);
  };
}

export default hook()(BuildRow);
