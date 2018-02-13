export interface IVersionCheck {
  command?: string;
  args: string[];
  parser?: RegExp;
}

export interface IFormulaSpec {
  format: string;
  subfolder?: string;
  versionCheck?: IVersionCheck;
  sanityCheck?: {
    command: string;
    args: string[];
  };
}

export interface ISkipUpgradeResult {
  /** reason why we're skipping the upgrade */
  reason: string;
}

export interface IFormulas {
  butler: IFormulaSpec;

  [formulaName: string]: IFormulaSpec;
}

let self = {} as IFormulas;

/**
 * your little itch.io helper
 * https://github.com/itchio/butler
 */
self.butler = {
  format: "gz",
  sanityCheck: {
    command: "butler",
    args: ["-V"],
  },
  versionCheck: {
    command: "butler",
    args: ["-V"],
  },
};

export default self;
