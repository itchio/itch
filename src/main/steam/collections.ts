import { mainLogger } from "main/logger";
import { existsSync, readFileSync, renameSync, writeFileSync } from "fs";
import { join } from "path";

const logger = mainLogger.child(__filename);

// The cloudstorage files are an undocumented Valve format, synced to the
// cloud when Steam starts. Unrecognized structure means abort, not repair.

const COLLECTION_NAME = "itch.io";
const OWN_ID = "itch-io";
const OWN_KEY = `user-collections.${OWN_ID}`;
const COLLECTION_KEY_PREFIX = "user-collections.";

interface CloudStorageRecord {
  key: string;
  timestamp: number;
  value?: string;
  version: string;
  conflictResolutionMethod?: string;
  strMethodId?: string;
  is_deleted?: boolean;
}

interface CollectionValue {
  id: string;
  name: string;
  added: number[];
  removed: number[];
}

export interface CollectionSync {
  /** unsigned shortcut appids that should be in the collection */
  ensure: number[];
  /** unsigned appids to drop: removed entries and superseded appids */
  remove: number[];
}

// [[1,"798"],[3,"0"]] pairs of namespace number and version; the live
// namespace is the highest-versioned one
function activeNamespace(namespacesPath: string): number {
  const parsed = JSON.parse(readFileSync(namespacesPath, "utf8"));
  if (Array.isArray(parsed)) {
    const pairs = parsed.filter(
      (p): p is [number, string] => Array.isArray(p) && p.length >= 2
    );
    pairs.sort((a, b) => parseInt(b[1], 10) - parseInt(a[1], 10));
    if (pairs.length > 0 && pairs[0][1] !== "0") {
      return pairs[0][0];
    }
  }
  return 1;
}

function parseCollection(record: CloudStorageRecord): CollectionValue | null {
  if (typeof record.value !== "string") {
    return null;
  }
  try {
    const value = JSON.parse(record.value);
    if (typeof value !== "object" || value === null) {
      return null;
    }
    return {
      id: typeof value.id === "string" ? value.id : "",
      name: typeof value.name === "string" ? value.name : "",
      added: Array.isArray(value.added) ? value.added : [],
      removed: Array.isArray(value.removed) ? value.removed : [],
    };
  } catch (e) {
    return null;
  }
}

function sameMembers(a: number[], b: Set<number>): boolean {
  return a.length === b.size && a.every((id) => b.has(id));
}

/**
 * Ensures the "itch.io" Steam collection reflects our shortcut entries.
 * Adopts a same-named collection if the user already has one; otherwise
 * creates one with a fixed id. Steam must not be running (the caller's
 * shortcuts.vdf write already guarantees that window).
 */
export function syncItchCollection(configDir: string, sync: CollectionSync) {
  const dir = join(configDir, "cloudstorage");
  const namespacesPath = join(dir, "cloud-storage-namespaces.json");
  if (!existsSync(namespacesPath)) {
    logger.info("no cloud storage namespaces; skipping collection sync");
    return;
  }
  const filePath = join(
    dir,
    `cloud-storage-namespace-${activeNamespace(namespacesPath)}.json`
  );
  if (!existsSync(filePath)) {
    logger.info("no cloud storage namespace file; skipping collection sync");
    return;
  }
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  if (!Array.isArray(data)) {
    throw new Error("unexpected cloud storage structure");
  }

  // prefer a live collection named "itch.io" regardless of id, so one the
  // user made by hand gets adopted instead of duplicated; fall back to our
  // own entry even if tombstoned, so re-adding resurrects it
  let index = -1;
  let ownIndex = -1;
  let record: CloudStorageRecord | null = null;
  let collection: CollectionValue | null = null;
  for (let i = 0; i < data.length; i++) {
    const pair = data[i];
    if (!Array.isArray(pair) || typeof pair[0] !== "string") {
      continue;
    }
    const key: string = pair[0];
    if (!key.startsWith(COLLECTION_KEY_PREFIX)) {
      continue;
    }
    const candidate = pair[1] as CloudStorageRecord;
    if (typeof candidate !== "object" || candidate === null) {
      continue;
    }
    if (key === OWN_KEY) {
      ownIndex = i;
    }
    if (candidate.is_deleted) {
      continue;
    }
    const value = parseCollection(candidate);
    if (value && value.name.toLowerCase() === COLLECTION_NAME.toLowerCase()) {
      index = i;
      record = candidate;
      collection = value;
      break;
    }
  }
  if (index === -1 && ownIndex !== -1) {
    index = ownIndex;
    record = data[ownIndex][1];
    collection = record ? parseCollection(record) : null;
  }

  const removeSet = new Set(sync.remove);
  const oldAdded = collection?.added ?? [];
  const added = new Set(oldAdded.filter((id) => !removeSet.has(id)));
  for (const id of sync.ensure) {
    added.add(id);
  }
  // membership removals also go on the collection's removed list so the
  // union-based cloud merge can't resurrect them from a stale copy
  const removed = new Set(collection?.removed ?? []);
  for (const id of sync.ensure) {
    removed.delete(id);
  }
  for (const id of oldAdded) {
    if (!added.has(id)) {
      removed.add(id);
    }
  }

  const tombstone = added.size === 0 && (!record || record.key === OWN_KEY);
  const unchanged =
    collection !== null &&
    record !== null &&
    !record.is_deleted &&
    sameMembers(collection.added, added) &&
    sameMembers(collection.removed, removed);
  if (unchanged || (added.size === 0 && index === -1)) {
    return;
  }
  if (tombstone && record?.is_deleted) {
    return;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const prevVersion = record ? parseInt(record.version, 10) : 0;
  const version = Math.max(isNaN(prevVersion) ? 0 : prevVersion + 1, timestamp);
  const key = record?.key ?? OWN_KEY;
  const value: CollectionValue = {
    id: collection?.id || OWN_ID,
    name: collection?.name || COLLECTION_NAME,
    added: [...added].sort((a, b) => a - b),
    removed: [...removed].sort((a, b) => a - b),
  };
  const updated: CloudStorageRecord = {
    ...record,
    key,
    timestamp,
    value: JSON.stringify(value),
    version: String(version),
    conflictResolutionMethod: record?.conflictResolutionMethod ?? "custom",
    strMethodId: record?.strMethodId ?? "union-collections",
  };
  if (tombstone) {
    updated.is_deleted = true;
  } else {
    delete updated.is_deleted;
  }

  if (index !== -1) {
    data[index] = [key, updated];
  } else {
    data.push([key, updated]);
  }

  // atomic swap, same rule as shortcuts.vdf: a crash mid-write must not
  // truncate the user's collections
  const tmp = `${filePath}.itch-tmp`;
  writeFileSync(tmp, JSON.stringify(data));
  renameSync(tmp, filePath);
  logger.info(
    `synced "${value.name}" Steam collection: ${added.size} entries` +
      (tombstone ? " (tombstoned)" : "")
  );
}
