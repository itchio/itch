import spawn from "../../os/spawn";
import common from "./common";

import { devNull } from "../../logger";

import { ISandbox, INeed, ICaretaker } from "./types";

const userNeed: ICaretaker = async (ctx, need) => {
  const res = await spawn.exec({
    ctx,
    command: "butler",
    args: ["elevate", "--", "isolate.exe", "--setup"],
    logger: devNull,
  });
  if (res.code !== 0) {
    throw new Error(
      `setup failed with code ${res.code}. out = ${res.out}, err = ${res.err}`
    );
  }
};

const win32Sandbox: ISandbox = {
  check: async ctx => {
    const errors: Error[] = [];
    const needs: INeed[] = [];

    const userCheck = await spawn.exec({
      ctx,
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

  install: async (ctx, needs) => {
    return await common.tendToNeeds(ctx, needs, {
      user: userNeed,
    });
  },

  within: async (opts, cb) => {
    throw new Error(`sandbox.within on win32: stub`);
  },
};
export default win32Sandbox;
