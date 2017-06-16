
/** Maps tasks (installing, configuring, etc.) to icons */
interface IIconForTasks {
  [key: string]: string;
}

export default {
  "report": "upload-to-cloud",
  "error": "heart-broken",
  "download": "download",
  "install": "file-zip",
  "uninstall": "delete",
  "ask-before-install": "install",
  "configure": "cog",
  "launch": "fire",
  "idle": "checkmark",
  /* status tasks */
  "open": "folder-open",
  "update": "download",
} as IIconForTasks;
