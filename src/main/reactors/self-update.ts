import { getErrorStack } from "common/butlerd/errors";
import childProcess from "child_process";
import { actions } from "common/actions";
import { t } from "common/format/t";
import urls from "common/constants/urls";
import { Store } from "common/types";
import { relaunchLogPath } from "main/util/paths";
import { Watcher } from "common/util/watcher";
import fs from "fs";
import {
  ISM,
  ISM_Progress,
  ISM_UpdateFailed,
  syncItchSetupLauncher,
} from "main/broth/itch-setup";
import { mainLogger } from "main/logger";
import { manager } from "main/reactors/setup";
import ospath, { dirname } from "path";
import modals from "main/modals";
import { delay } from "main/reactors/delay";

const logger = mainLogger.child(__filename);

// 2 hours, * 60 = minutes, * 60 = seconds, * 1000 = millis
const UPDATE_INTERVAL = 2 * 60 * 60 * 1000;
const UPDATE_INTERVAL_WIGGLE = 0.2 * 60 * 60 * 1000;

export default function (watcher: Watcher) {
  watcher.on(actions.tick, async (store, action) => {
    const rs = store.getState();
    const { nextComponentsUpdateCheck } = rs.systemTasks;

    let componentCheckPastDue = Date.now() > nextComponentsUpdateCheck;
    let setupDone = rs.setup.done;

    let shouldUpdateNow = setupDone && componentCheckPastDue;
    if (!shouldUpdateNow) {
      return;
    }

    rescheduleComponentsUpdate(store);
    store.dispatch(actions.checkForComponentUpdates({}));
  });

  watcher.on(actions.checkForComponentUpdates, async (store, action) => {
    rescheduleComponentsUpdate(store);
    await manager.upgrade({ logger: mainLogger });
    if (action.payload.manual) {
      await syncItchSetupLauncher(store, mainLogger);
    }
  });

  watcher.on(actions.relaunchRequest, async (store, action) => {
    const rs = store.getState();
    const pkg = rs.broth.packages[rs.system.appName];
    if (pkg.stage !== "need-restart") {
      return;
    }
    const version = pkg.availableVersion;
    const restartKey = pkg.needsElevation
      ? "prompt.self_update_ready.action.restart_elevated"
      : "prompt.self_update_ready.action.restart";
    const restart = t(rs.i18n, [restartKey]);
    const messageKey = pkg.needsElevation
      ? "prompt.self_update_ready.message_elevated"
      : "prompt.self_update_ready.message";

    store.dispatch(
      actions.openModal(
        modals.naked.make({
          wind: "root",
          title: ["prompt.self_update.title", { version }],
          message: [messageKey, { restart }],
          buttons: [
            {
              label: ["prompt.self_update_ready.action.release_notes"],
              className: "secondary",
              left: true,
              action: actions.openInExternalBrowser({
                url: urls.releasesPage,
              }),
            },
            {
              label: [restartKey],
              action: actions.relaunch({}),
            },
            {
              label: ["prompt.self_update_ready.action.snooze"],
              className: "secondary",
              action: actions.closeModal({ wind: "root" }),
            },
          ],
          widgetParams: null,
        })
      )
    );
  });

  watcher.on(actions.relaunch, async (store, action) => {
    const rs = store.getState();
    const pkg = rs.broth.packages["itch-setup"];
    if (pkg.stage !== "idle") {
      logger.warn(`itch-setup: wanted pkg stage idle but got '${pkg.stage}'`);
      return;
    }

    const prefix = pkg.versionPrefix;
    if (!prefix) {
      logger.warn(`itch-setup: no prefix (not installed yet?)`);
      return;
    }

    const command = ospath.join(prefix, "itch-setup");
    const logPath = relaunchLogPath();
    const args: string[] = [
      "--appname",
      rs.system.appName,
      "--relaunch",
      "--relaunch-pid",
      `${process.pid}`,
    ];

    // The install folder isn't writable by us, so nothing has been
    // downloaded yet: the elevated itch-setup does the upgrade and the
    // restart in one go (one UAC prompt). It can't inherit our stdout,
    // so it reports through the log file instead.
    const selfPkg = rs.broth.packages[rs.system.appName];
    const needsElevation = !!selfPkg.needsElevation;
    const availableVersion = selfPkg.availableVersion;
    if (needsElevation) {
      if (!availableVersion) {
        logger.warn(`relaunch: need-restart without a version, ignoring`);
        return;
      }
      args.push("--elevate", "--upgrade", "--log-file", logPath);
    }

    const fail = (message: string) => {
      logger.error(`itch-setup could not apply the update: ${message}`);
      if (!availableVersion) {
        return;
      }
      // undo the download stage so the update prompt comes back
      store.dispatch(
        actions.packageNeedRestart({
          name: rs.system.appName,
          availableVersion,
          needsElevation,
        })
      );
      store.dispatch(
        actions.openModal(
          modals.naked.make({
            wind: "root",
            title: ["prompt.self_update.title", { version: availableVersion }],
            message: ["prompt.self_update_failed.message", { message }],
            buttons: ["ok"],
            widgetParams: null,
          })
        )
      );
    };

    const stdio: any[] = ["ignore", "ignore", "ignore"];
    try {
      fs.mkdirSync(dirname(logPath));
    } catch {}
    try {
      fs.unlinkSync(logPath);
    } catch {}

    let out = -1;
    let err = -1;
    try {
      if (fs.existsSync(logPath)) {
        fs.unlinkSync(logPath);
      }
      out = fs.openSync(logPath, "a");
      stdio[1] = out;
      err = fs.openSync(logPath, "a");
      stdio[2] = err;
    } catch (e) {
      logger.warn(
        `Could not set up stdout/stderr for relaunch: ${getErrorStack(e)}`
      );
      if (out != -1) {
        fs.closeSync(out);
      }
      if (err != -1) {
        fs.closeSync(err);
      }
    }
    const child = childProcess.spawn(command, args, {
      // itch-setup must not inherit our working directory: if we were
      // launched from a versioned app folder, Windows would refuse to
      // rename that folder during update promotion while itch-setup
      // sits in it
      cwd: rs.system.userDataPath,
      stdio,
      detached: true,
    });
    child.unref();

    // a plain relaunch signals within a few seconds; an elevated one
    // downloads the update first, so it may take a while
    const deadline = Date.now() + (needsElevation ? 15 * 60 * 1000 : 7500);
    // only complete, newline-terminated lines are consumed: the file
    // starts out empty and the last line may still be being written
    let consumed = 0;
    while (Date.now() < deadline) {
      try {
        const file = fs.readFileSync(logPath, { encoding: "utf8" });
        const lastNewline = file.lastIndexOf("\n");
        if (lastNewline < consumed) {
          await delay(250);
          continue;
        }
        const lines = file.slice(consumed, lastNewline).split("\n");
        consumed = lastNewline + 1;

        for (const line of lines) {
          let msg: ISM;
          try {
            msg = JSON.parse(line) as ISM;
          } catch (e) {
            continue;
          }

          if (msg.type === "ready-to-relaunch") {
            logger.info(`itch-setup is ready to relaunch!`);
            store.dispatch(actions.quit({}));
            return;
          } else if (msg.type === "update-failed") {
            fail((msg.payload as ISM_UpdateFailed).message);
            return;
          } else if (msg.type === "installing-update") {
            store.dispatch(
              actions.packageStage({
                name: rs.system.appName,
                stage: "download",
              })
            );
          } else if (msg.type === "progress") {
            store.dispatch(
              actions.packageProgress({
                name: rs.system.appName,
                progressInfo: msg.payload as ISM_Progress,
              })
            );
          }
        }
      } catch (e) {
        logger.warn(`While polling itch-setup log: ${getErrorStack(e)}`);
      }
      await delay(250);
    }

    logger.error(
      `itch-setup never signaled ready-to-relaunch (see ${logPath}), staying on current version`
    );
    if (needsElevation) {
      fail(`timed out waiting for itch-setup (see ${logPath})`);
    }
  });
}

function rescheduleComponentsUpdate(store: Store) {
  const sleepTime = UPDATE_INTERVAL + Math.random() + UPDATE_INTERVAL_WIGGLE;
  store.dispatch(
    actions.scheduleSystemTask({
      nextComponentsUpdateCheck: Date.now() + sleepTime,
    })
  );
}
