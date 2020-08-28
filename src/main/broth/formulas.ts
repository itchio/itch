import { Client } from "butlerd";
import { messages } from "common/butlerd";
import { makeButlerInstance } from "common/butlerd/make-butler-instance";
import env from "common/env";
import { Logger } from "common/logger";
import spawn from "main/os/spawn";
import ospath from "path";
import { MinimalContext } from "main/context";

export interface FormulaSpec {
  sanityCheck?: (
    ctx: MinimalContext,
    logger: Logger,
    versionPrefix: string
  ) => Promise<void>;
  transformChannel?: (channel: string) => string;
  getSemverConstraint?: () => string | null;
  requiredAtStartup?: boolean;
}

interface Formulas {
  butler: FormulaSpec;

  [formulaName: string]: FormulaSpec;
}

let self = {} as Formulas;

function describeFormula(name: string, formula: FormulaSpec) {
  self[name] = formula;
}

/**
 * your little itch.io helper
 * https://github.com/itchio/butler
 */
describeFormula("butler", {
  sanityCheck: async (ctx, logger, versionPrefix) => {
    const instance = await makeButlerInstance({ ctx, versionPrefix });
    // we're awaiting it later, avoid 'unhandledRejection'
    instance.promise().catch(() => {});

    const client = new Client(await instance.getEndpoint());
    await client.call(messages.VersionGet, {});
  },
  transformChannel: (channel) => {
    if (env.isCanary) {
      return `${channel}-head`;
    }
    return channel;
  },
  getSemverConstraint: () => {
    if (env.isCanary) {
      return null;
    }
    return "^15.20.0";
  },
  requiredAtStartup: true,
});

/**
 * itch installer & self-update helper
 * https://github.com/itchio/itch-setup
 */
describeFormula("itch-setup", {
  sanityCheck: async (ctx, logger, versionPrefix) => {
    await spawn({
      ctx,
      logger,
      command: ospath.join(versionPrefix, "itch-setup"),
      args: ["--version"],
    });
  },
  transformChannel: (channel) => {
    if (env.isCanary) {
      return `${channel}-head`;
    }
    return channel;
  },
  getSemverConstraint: () => {
    if (env.isCanary) {
      return null;
    }
    return "^1.8.0";
  },
});

export default self;
