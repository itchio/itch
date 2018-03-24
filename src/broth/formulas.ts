import { messages } from "../buse";
import { Client } from "node-buse";
import { makeButlerInstanceWithPrefix } from "../buse/master-client";

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
    console.log(`sanity check: making instance...`);
    const instance = await makeButlerInstanceWithPrefix(versionPrefix);
    try {
      console.log(`creating client...`);
      const client = new Client(await instance.getEndpoint());
      console.log(`connecting client...`);
      await client.connect();
      console.log(`calling...`);
      await client.call(messages.VersionGet, {});
      console.log(`calling close...`);
      client.close();
    } finally {
      console.log(`awaiting instance`);
      await instance.promise();
    }
  },
});

export default self;
