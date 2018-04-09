import { Upload } from "common/butlerd/messages";

export function formatUploadTitle(u: Upload): string {
  return u ? u.displayName || u.filename : "?";
}
