import { app, session } from "electron";
import { NET_PARTITION_NAME } from "common/constants/net";

let _cachedUserAgent: string;
export function userAgent() {
  if (!_cachedUserAgent) {
    const netSession = session.fromPartition(NET_PARTITION_NAME, {
      cache: false,
    });
    _cachedUserAgent = `${netSession.getUserAgent()} itch/${app.getVersion()}`;
  }
  return _cachedUserAgent;
}

let _cachedButlerUserAgent: string;
export function butlerUserAgent() {
  if (!_cachedButlerUserAgent) {
    _cachedButlerUserAgent = `itch/${app.getVersion()} (${process.platform})`;
  }
  return _cachedButlerUserAgent;
}
