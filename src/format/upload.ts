import { Upload } from "ts-itchio-api";

export function formatUploadTitle(u: Upload) {
  return u ? u.displayName || u.filename : "?";
}
