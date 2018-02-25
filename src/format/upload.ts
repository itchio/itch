import { Upload } from "node-buse/lib/messages";

export function formatUploadTitle(u: Upload) {
  return u ? u.displayName || u.filename : "?";
}
