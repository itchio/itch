import { Client } from "butlerd";
import { messages } from "../butlerd";
import { makeButlerInstanceWithPrefix } from "../butlerd/master-client";

export interface FormulaSpec {
  sanityCheck?: (versionPrefix: string) => Promise<void>;
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
    try {
      const client = new Client(await instance.getEndpoint());
      await client.connect();
      await client.call(messages.VersionGet, {});
      client.close();
    } finally {
      await instance.promise();
    }
  },
});

export default self;
