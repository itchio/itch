
import spawn from "./spawn";
import * as os from "os";
import * as childProcess from "child_process";

interface IAssertPresenceResult {
  code: number;
  stdout: string;
  stderr: string;
  parsed: string;
}

export type ItchPlatform = "osx" | "windows" | "linux" | "unknown";

const WIN64_ARCHES = {
  AMD64: true,
  IA64: true,
} as {
  [key: string]: boolean;
};

const self = {
  platform: function (): string {
    return process.platform;
  },

  release: function (): string {
    return os.release();
  },

  arch: function (): string {
    return process.arch;
  },

  inBrowser: function (): boolean {
    return self.processType() === "browser";
  },

  inRenderer: function (): boolean {
    return self.processType() === "renderer";
  },

  processType: function (): string {
    return process.type || "browser";
  },

  getVersion: function (key: string): string {
    // electron has additional version keys, so we have to bypass regular node typings
    return (process.versions as any)[key];
  },

  /**
   * Get platform in the format used by the itch.io API
   */
  itchPlatform: function (): ItchPlatform {
    switch (self.platform()) {
      case "darwin":
        return "osx";
      case "win32":
        return "windows";
      case "linux":
        return "linux";
      default:
        return "unknown";
    }
  },

  cliArgs: function (): string[] {
    return process.argv;
  },

  assertPresence: async function
      (command: string, args: string[], parser: RegExp, extraOpts = {} as any): Promise<IAssertPresenceResult> {
    let stdout = "";
    let stderr = "";

    args = args || [];

    const spawnOpts = {
      command,
      args,
      onToken: (tok: string) => { stdout += "\n" + tok; },
      onErrToken: (tok: string) => { stderr += "\n" + tok; },
      opts: extraOpts,
    };

    const code = await spawn(spawnOpts);
    if (code !== 0) {
      throw new Error(`${command} exited with code ${code}\n${stdout}\n${stderr}`);
    }

    let parsed: string = null;
    if (parser) {
      let matches = parser.exec(stdout + "\n" + stderr);
      if (matches) {
        parsed = matches[1];
      }
    }

    return { code, stdout, stderr, parsed };
  },

  isWin64: function(): boolean {
    // 64-bit exe on 64-bit windows: PROCESSOR_ARCHITECTURE has the original arch
    // 32-bit exe on 64-bit windows: PROCESSOR_ARCHITECTURE has x86, PROCESSOR_ARCHITEW6432 has the real one
    return process.arch === "x64" ||
      WIN64_ARCHES[process.env.PROCESSOR_ARCHITECTURE] ||
      WIN64_ARCHES[process.env.PROCESSOR_ARCHITEW6432];
  },

  isLinux64: function(): boolean {
    try {
      // weeeeeeeee
      const arch = String(childProcess.execSync("uname -m")).trim();
      return (arch === "x86_64");
    } catch (e) {
      // tslint:disable-next-line
      console.log(`Could not determine if linux64 via uname: ${e.message}`);
    }

    try {
      // weeeeeeeee
      const arch = String(childProcess.execSync("arch")).trim();
      return (arch === "x86_64");
    } catch (e) {
      // tslint:disable-next-line
      console.log(`Could not determine if linux64 via arch: ${e.message}`);
    }

    // if we're lacking uname AND arch, honestly, our chances are slim.
    // but in doubt, let's just assume the architecture of itch is the
    // same as the os.
    return process.arch === "x64";
  },
};

export default self;
