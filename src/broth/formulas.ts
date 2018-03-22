import { messages, makeButlerInstanceWithPrefix } from "../buse";

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
      const client = await instance.getClient();
      await client.call(messages.VersionGet, {});
    } finally {
      instance.cancel();
    }
  },
});

export default self;
