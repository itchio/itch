import { actions } from "common/actions";
import { Build, Platforms } from "common/butlerd/messages";
import platformData from "common/constants/platform-data";
import { fileSize } from "common/format/filesize";
import { MenuTemplate, PushJob } from "common/types";
import { ambientWind, urlForGame } from "common/util/navigation";
import modals from "renderer/modals";
import React, { useState } from "react";
import Icon from "renderer/basics/Icon";
import TimeAgo from "renderer/basics/TimeAgo";
import { useAppDispatch } from "renderer/hooks/redux";
import ExpandedDetails from "renderer/pages/UploadPage/BuildRow/ExpandedDetails";
import { deriveRowData } from "renderer/pages/UploadPage/BuildRow/row-data";
import BuildStatusTag from "renderer/pages/UploadPage/BuildStatusTag";
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

const ProjectThumb = styled.div`
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
  min-width: 0;
`;

const VersionLine = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.baseText};
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const BoltIcon = styled.svg`
  width: 0.9em;
  height: 0.9em;
  flex-shrink: 0;
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

interface Props {
  /** Server-side build, or null when the row is purely a synthetic in-flight push. */
  build: Build | null;
  /** Local push job matching this row. For rows with no server build it
   *  drives every field; for server rows it overlays live progress / a
   *  terminal status that the server hasn't caught up to yet. Match is by
   *  buildId (set by Publish.Push.BuildAssigned), so no risk of attaching
   *  a fresh push to a historical build on the same channel. */
  pushJob?: PushJob;
  onSetSearch: (search: string) => void;
}

const BuildRow = (props: Props) => {
  const { build, pushJob, onSetSearch } = props;
  const dispatch = useAppDispatch();

  // Auto-expand only for cases where the user genuinely wants the
  // detail open: synthetic-only rows (no server build, the row IS the
  // job) and actively-uploading overlays. Don't auto-expand for
  // already-handed-off or terminal overlays — re-mounts (search,
  // filter, polling reorders) would otherwise force the row back open
  // every time, even after the user collapsed it. Lazy useState runs on
  // mount only, matching those semantics.
  const [expanded, setExpanded] = useState(
    () => !build || pushJob?.status === "pushing"
  );

  const data = deriveRowData(build, pushJob);

  const toggle = () => setExpanded((s) => !s);

  const handleCaretClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    toggle();
  };

  const handleChannelClick = (ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (!data.channelName) return;
    onSetSearch(data.channelName);
  };

  const handleKebab = (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();

    const template: MenuTemplate = [];
    if (data.gameId) {
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
                prefilledChannel: data.channelName || undefined,
              },
            })
          ),
        });
      }
      template.push({
        localizedLabel: ["upload.menu.view_project"],
        action: actions.navigate({
          wind: ambientWind(),
          url: urlForGame(data.gameId),
          background: true,
        }),
      });
    }
    template.push({
      localizedLabel: ["upload.menu.copy_command"],
      action: actions.copyToClipboard({ text: data.butlerCmd }),
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

  return (
    <Row className={expanded ? "expanded" : ""}>
      <Header onClick={toggle} onContextMenu={handleKebab}>
        <Caret
          type="button"
          className={expanded ? "open" : ""}
          onClick={handleCaretClick}
          aria-expanded={expanded}
          aria-label={
            expanded ? "Collapse build details" : "Expand build details"
          }
        >
          <Icon icon="caret-down" />
        </Caret>
        <Project>
          <ProjectThumb>
            {data.projectCoverUrl ? (
              <ProjectCoverImg
                src={data.projectCoverUrl}
                alt={data.projectTitle}
              />
            ) : (
              projectInitials(data.projectTitle)
            )}
          </ProjectThumb>
          <ProjectText>
            <ProjectTitle>{data.projectTitle || "—"}</ProjectTitle>
            <ProjectSlug>{data.projectSlug}</ProjectSlug>
          </ProjectText>
        </Project>
        <Channel onClick={handleChannelClick} disabled={!data.channelName}>
          {data.platforms ? <Icon icon={platformIcon(data.platforms)} /> : null}
          <span>{data.channelName}</span>
        </Channel>
        <Version>
          <VersionLine
            title={
              data.userVersion ??
              (build?.version ? `v${build.version}` : undefined)
            }
          >
            {data.userVersion ?? (build?.version ? `v${build.version}` : "—")}
          </VersionLine>
        </Version>
        <Cell>
          <BuildStatusTag
            build={build ?? undefined}
            pushJob={pushJob ?? null}
          />
        </Cell>
        <SizeCell>
          <SizePrimary>
            {data.archiveSize > 0 ? fileSize(data.archiveSize) : "—"}
          </SizePrimary>
          {data.patchSize > 0 ? (
            <SizeSecondary>
              {T([
                "upload.size.patch_subtext",
                { size: fileSize(data.patchSize) },
              ])}
              {data.patchIsOptimized ? (
                <BoltIcon
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  role="img"
                  aria-label="optimized"
                  data-rh={JSON.stringify(
                    _("upload.size.patch_optimized_hint")
                  )}
                  data-rh-at="top"
                >
                  <path d="M13 2 L4 14 L11 14 L10 22 L20 10 L13 10 Z" />
                </BoltIcon>
              ) : null}
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
        <Kebab onClick={handleKebab}>
          <Icon icon="more_vert" />
        </Kebab>
      </Header>
      {expanded ? (
        <ExpandedDetails build={build} pushJob={pushJob} data={data} />
      ) : null}
    </Row>
  );
};

export default React.memo(BuildRow);
