import { Upload } from "../buse/messages";

export function formatUploadTitle(u: Upload): string {
  return u ? u.displayName || u.filename : "?";
}
