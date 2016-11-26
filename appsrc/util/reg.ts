
import * as ospath from "path";

import spawn from "./spawn";

import mklog from "./log";
const log = mklog("registry");
const opts = {logger: new mklog.Logger()};

let base = "HKCU\\Software\\Classes\\itchio";

let systemRoot = process.env.SystemRoot || "missing-system-root";
let system32Path = ospath.join(systemRoot, "System32");
let regPath = ospath.join(system32Path, "reg.exe");

interface IQueryOpts {
  /** if true, don't log output */
  quiet?: boolean;
}

let self = {
  regQuery: async function (key: string, queryOpts: IQueryOpts = {}): Promise<void> {
    await spawn.assert({
      command: regPath,
      args: ["query", key, "/s"],
      onToken: queryOpts.quiet ? null : (tok) => log(opts, "query: " + tok),
    });
  },

  regAddDefault: async function (key: string, value: string): Promise<void> {
    await spawn.assert({
      command: regPath,
      args: ["add", key, "/ve", "/d", value, "/f"],
    });
  },

  regAddEmpty: async function (key: string, value: string): Promise<void> {
    await spawn.assert({
      command: regPath,
      args: ["add", key, "/v", value, "/f"],
    });
  },

  regDeleteAll: async function (key: string): Promise<void> {
    await spawn.assert({
      command: regPath,
      args: ["delete", key, "/f"],
    });
  },

  install: async function (): Promise<void> {
    try {
      await self.regAddDefault(base, "URL:itch.io protocol");
      await self.regAddEmpty(base, "URL protocol");
      await self.regAddDefault(`${base}\\DefaultIcon`, "itch.exe");
      await self.regAddDefault(`${base}\\Shell\\Open\\Command`, `"${process.execPath}" "%1"`);
    } catch (e) {
      log(opts, `Could not register itchio:// as default protocol handler: ${e.stack || e}`);
    }
  },

  update: async function (): Promise<void> {
    await self.install();
  },

  uninstall: async function (): Promise<void> {
    try {
      await self.regDeleteAll(base);
    } catch (e) {
      log(opts, `Could not register itchio:// as default protocol handler: ${e.stack || e}`);
    }
  },
};

export default self;
