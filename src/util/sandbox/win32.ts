
import spawn from "../../os/spawn";
import common from "./common";

import {ICheckResult, INeed} from "./types";

export async function check(): Promise<ICheckResult> {
  const errors: Error[] = [];
  const needs: INeed[] = [];

  const userCheck = await spawn.exec({ command: "isolate.exe", args: ["--check"] });
  if (userCheck.code !== 0) {
    needs.push({
      type: "user",
      err: userCheck.err,
      code: userCheck.code,
    });
  }

  return { errors, needs };
}

export async function install(opts: any, needs: INeed[]) {
  return await common.tendToNeeds(opts, needs, {
    user: async function () {
      const res = await spawn.exec({ command: "elevate.exe", args: ["isolate.exe", "--setup"] });
      if (res.code !== 0) {
        throw new Error(`setup failed with code ${res.code}. out = ${res.out}, err = ${res.err}`);
      }
    },
  });
}

export async function uninstall(opts: any) {
  return { errors: [] };
}

export default { check, install, uninstall };
