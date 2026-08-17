import {
  Build,
  BuildFile,
  BuildFileSubType,
  BuildFileType,
  Platforms,
} from "common/butlerd/messages";
import { PushJob } from "common/types";
import { targetForGame } from "renderer/modal-widgets/PushBuild/target";

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
    const matches = files.filter((f) => f.type === t);
    // Default subType before Optimized so the original patch lists first.
    matches.sort((a, b) => {
      const ao = a.subType === BuildFileSubType.Optimized ? 1 : 0;
      const bo = b.subType === BuildFileSubType.Optimized ? 1 : 0;
      return ao - bo;
    });
    for (const f of matches) out.push(f);
  }
  for (const f of files) {
    if (!BUILD_FILE_TYPE_ORDER.includes(f.type)) out.push(f);
  }
  return out;
}

export interface RowData {
  projectTitle: string;
  projectSlug: string;
  projectCoverUrl: string | null;
  channelName: string;
  userVersion: string | null;
  buildIdLabel: string;
  archiveSize: number;
  patchSize: number;
  patchIsOptimized: boolean;
  orderedFiles: BuildFile[];
  platforms: Platforms | undefined;
  butlerCmd: string;
  gameId: number | undefined;
}

// Synthetic-only rows (no server build yet) fall back to fields the
// push modal stashed on the job at dispatch time.
export function deriveRowData(build: Build | null, pushJob?: PushJob): RowData {
  const game = build?.game;
  const upload = build?.upload;

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

  const archiveFile = findBuildFile(build?.files, BuildFileType.Archive);
  // Prefer the optimized patch when present — it's the smaller download
  // players will actually receive once async optimization finishes.
  const patchFile =
    build?.files?.find(
      (f) =>
        f.type === BuildFileType.Patch &&
        f.subType === BuildFileSubType.Optimized
    ) ?? findBuildFile(build?.files, BuildFileType.Patch);

  return {
    projectTitle,
    projectSlug,
    projectCoverUrl,
    channelName,
    userVersion: build?.userVersion?.trim() || null,
    buildIdLabel: build ? `#${build.id}` : "",
    archiveSize: archiveFile?.size ?? upload?.size ?? 0,
    patchSize: patchFile?.size ?? 0,
    patchIsOptimized: patchFile?.subType === BuildFileSubType.Optimized,
    orderedFiles: orderedBuildFiles(build?.files),
    platforms: upload?.platforms,
    butlerCmd: `butler push <dir> ${target}:${channelName}`,
    gameId: game?.id ?? pushJob?.gameId,
  };
}
