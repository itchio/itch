import spawn from "../../os/spawn";
import common from "./common";

import { devNull } from "../../logger";

import { ISandbox, INeed } from "./types";

const win32Sandbox: ISandbox = {
  check: async () => {
    const errors: Error[] = [];
    const needs: INeed[] = [];

    const userCheck = await spawn.exec({
      command: "isolate.exe",
      args: ["--check"],
      logger: devNull,
    });
    if (userCheck.code !== 0) {
      needs.push({
        type: "user",
        err: userCheck.err,
        code: userCheck.code,
      });
    }

    return { errors, needs };
  },

  install: async needs => {
    return await common.tendToNeeds(needs, {
      user: async function() {
        const res = await spawn.exec({
          command: "elevate.exe",
          args: ["isolate.exe", "--setup"],
          logger: devNull,
        });
        if (res.code !== 0) {
          throw new Error(
            `setup failed with code ${res.code}. out = ${res.out}, err = ${res.err}`,
          );
        }
      },
    });
  },

  within: async (opts, cb) => {
    throw new Error(`sandbox.within on win32: stub`);
  },
};
export default win32Sandbox;
