import { shell, dialog } from "electron";
import electron from "electron";
const app = electron.app || electron.remote.app;

import env from "../env";

import path from "path";
import querystring from "querystring";

import platformData from "common/constants/platform-data";
import urls from "common/constants/urls";
import { isNetworkError } from "main/net/errors";

import { isCancelled } from "common/types";

import { currentRuntime, runtimeProp } from "main/os/runtime";
import * as os from "main/os";
import * as sf from "main/os/sf";

import { t } from "common/format/t";
import { ItchPromise } from "./itch-promise";

enum ErrorType {
  UncaughtException,
  UnhandledRejection,
}

function errorTypeString(t: ErrorType): string {
  switch (t) {
    case ErrorType.UncaughtException:
      return "uncaught exception";
    case ErrorType.UnhandledRejection:
      return "unhandled rejection";
    default:
      return "unknown error type";
  }
}

interface IReportIssueOpts {
  log?: string;
  body?: string;
  type?: string;
  repo?: string;
  before?: string;
}

let catching = false;

async function writeCrashLog(e: Error) {
  const crashFile = path.join(
    app.getPath("userData"),
    "crash_logs",
    `${+new Date()}.txt`
  );

  let log = "";
  log += e.stack || e.message || e;

  if (os.platform() === "win32") {
    log = log.replace(/\n/g, "\r\n");
  }
  await sf.writeFile(crashFile, log, { encoding: "utf8" });

  return { log, crashFile };
}

export function reportIssue(opts: IReportIssueOpts) {
  if (typeof opts === "undefined") {
    opts = {};
  }

  const log = opts.log;
  let body = opts.body || "";
  let type = opts.type || "Issue";
  const repo = opts.repo || urls.itchRepo;
  const before = opts.before || "";

  if (typeof log !== "undefined") {
    type = "Feedback";
    body = `Event log:

\`\`\`
${log}
\`\`\`
`;
  }

  const platformEmoji = platformData[runtimeProp(currentRuntime())].emoji;
  const query = querystring.stringify({
    title: `${platformEmoji} ${type} v${app.getVersion()}`,
    body: before + body,
  });
  let url = `${repo}/issues/new?${query}`;
  const maxLen = 2000;
  if (url.length > maxLen) {
    url = url.substring(0, maxLen);
  }
  shell.openExternal(url);
}

async function handle(type: ErrorType, e: Error) {
  if (catching) {
    console.log(`While catching: ${e.stack || e}`);
    return;
  }
  catching = true;

  console.log(`crash-reporter reporting: ${errorTypeString(type)}: ${e.stack}`);
  let res = await writeCrashLog(e);
  let log = res.log;
  let crashFile = res.crashFile;

  if (env.integrationTests) {
    console.log(`Crash log written to ${res.crashFile}, bailing out`);
    os.exit(1);
    return;
  }

  const store = require("main/store").default;
  const i18n = store.getState().i18n;

  const buttons = [
    t(i18n, [
      "prompt.crash_reporter.report_issue",
      { defaultValue: "Report issue" },
    ]),
    t(i18n, [
      "prompt.crash_reporter.open_crash_log",
      {
        defaultValue: "Open crash log",
      },
    ]),
    t(i18n, ["prompt.action.close", { defaultValue: "Close" }]),
  ];
  if (env.development) {
    buttons.push("Ignore and continue");
  }
  let dialogOpts = {
    type: "error" as "error", // woo typescript is crazy stuff, friendos
    buttons,
    message: t(i18n, [
      "prompt.crash_reporter.message",
      {
        defaultValue: "The application has crashed",
      },
    ]),
    detail: t(i18n, [
      "prompt.crash_reporter.detail",
      {
        defaultValue: `A crash log was written to ${crashFile}`,
        location: crashFile,
      },
    ]),
  };

  const response = await new ItchPromise((resolve, reject) =>
    dialog.showMessageBox(dialogOpts, resolve)
  );

  if (response === 0) {
    reportIssue({ log });
  } else if (response === 1) {
    shell.openItem(crashFile);
  } else if (response === 3) {
    // ignore and continue
    return;
  }
  os.exit(1);

  catching = false;
}

function makeHandler(type: ErrorType) {
  return (e: Error) => {
    if (isNetworkError(e)) {
      console.error(`Uncaught network error: ${e.stack}`);
      return;
    }

    if (isCancelled(e)) {
      console.error(`Something was cancelled: ${e.stack}`);
      return;
    }

    handle(type, e)
      .catch(e2 => {
        // well, we tried.
        console.log(`Error in crash-reporter (${type})\n${e2.stack}`);
      })
      .then(() => {
        if (type === ErrorType.UncaughtException) {
          os.exit(1);
        }
      });
  };
}

export function mount() {
  process.on("uncaughtException", makeHandler(ErrorType.UncaughtException));
  process.on("unhandledRejection", makeHandler(ErrorType.UnhandledRejection));
}
