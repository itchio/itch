import { Client } from "butlerd";
import { messages } from "common/butlerd";
import { makeButlerInstanceWithPrefix } from "common/butlerd/master-client";
import env from "common/env";
import spawn from "main/os/spawn";
import { MinimalContext } from "../context";
import rootLogger from "common/logger";
import ospath from "path";

export interface FormulaSpec {
  sanityCheck?: (versionPrefix: string) => Promise<void>;
  transformChannel?: (channel: string) => string;
  getSemverConstraint?: () => string | null;
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
  sanityCheck: async (versionPrefix: string) => {
    const instance = await makeButlerInstanceWithPrefix(versionPrefix);
    // we're awaiting it later, avoid 'unhandledRejection'
    instance.promise().catch(() => {});
    try {
      const client = new Client(await instance.getEndpoint());
      await client.connect();
      await client.call(messages.VersionGet, {});
      client.close();
    } finally {
      await instance.promise();
    }
  },
  transformChannel: (channel: string) => {
    if (env.isCanary) {
      return `${channel}-head`;
    }
    return channel;
  },
  getSemverConstraint: () => {
    if (env.isCanary) {
      return null;
    }
    return "^13.1.0";
  },
});

/**
 * itch installer & self-update helper
 * https://github.com/itchio/itch-setup
 */
describeFormula("itch-setup", {
  sanityCheck: async (versionPrefix: string) => {
    await spawn({
      ctx: new MinimalContext(),
      logger: rootLogger.child({ name: "itch-setup formula" }),
      command: ospath.join(versionPrefix, "itch-setup"),
      args: ["--version"],
    });
  },
  transformChannel: (channel: string) => {
    if (env.isCanary) {
      return `${channel}-head`;
    }
    return channel;
  },
  getSemverConstraint: () => {
    return null;
  },
});

export default self;
