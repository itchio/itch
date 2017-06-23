import * as tmp from "tmp";
import * as ospath from "path";

import spawn from "../../os/spawn";
import * as sf from "../../os/sf";
import ibrew from "../ibrew";

import rootLogger, { devNull } from "../../logger";
const logger = rootLogger.child({ name: "sandbox/linux" });

import common from "./common";

import { ISandbox, INeed } from "./types";

interface ISudoRunScriptResult {
  out: string;
}

async function sudoRunScript(lines: string[]): Promise<ISudoRunScriptResult> {
  const contents = lines.join("\n");
  const tmpObjName = tmp.tmpNameSync();
  await sf.writeFile(tmpObjName, contents, { encoding: "utf8" });
  await sf.chmod(tmpObjName, 0o777);

  const res = await spawn.exec({
    command: "pkexec",
    args: [tmpObjName],
    logger: devNull,
  });

  await sf.wipe(tmpObjName);

  if (res.code !== 0) {
    throw new Error(`pkexec failed with code ${res.code}, stderr = ${res.err}`);
  }

  return { out: res.out };
}

const firejailNeed = async function(need) {
  logger.info(`installing firejail, because ${need.err} (code ${need.code})`);

  const firejailBinary = ospath.join(ibrew.binPath(), "firejail");
  const firejailBinaryExists = await sf.exists(firejailBinary);
  if (!firejailBinaryExists) {
    throw new Error("firejail binary missing");
  } else {
    const lines: string[] = [];
    lines.push("#!/bin/bash -xe");
    lines.push(`chown root:root ${firejailBinary}`);
    lines.push(`chmod u+s ${firejailBinary}`);

    logger.info("Making firejail binary setuid");
    await sudoRunScript(lines);
  }
};

const linuxSandbox: ISandbox = {
  check: async () => {
    const needs: INeed[] = [];
    const errors: Error[] = [];

    logger.info("Testing firejail");
    const firejailCheck = await spawn.exec({
      command: "firejail",
      args: ["--noprofile", "--", "whoami"],
      logger: devNull,
    });
    if (firejailCheck.code !== 0) {
      needs.push({
        type: "firejail",
        code: firejailCheck.code,
        err: firejailCheck.err,
      });
    }

    return { needs, errors };
  },

  install: async needs => {
    return await common.tendToNeeds(needs, {
      firejail: firejailNeed,
    });
  },

  within: async (opts, cb) => {
    throw new Error("sandbox.within: stub on linux");
  },
};

export default linuxSandbox;
