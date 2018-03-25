import { Upload } from "../butlerd/messages";

export function formatUploadTitle(u: Upload): string {
  return u ? u.displayName || u.filename : "?";
}
