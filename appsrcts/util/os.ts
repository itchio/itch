
import spawn from "./spawn";
import * as os from "os";

interface IAssertPresenceResult {
  code: number;
  stdout: string;
  stderr: string;
  parsed: string;
}

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
  itchPlatform: function (): string {
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
      (command: string, args: string[], parser: RegExp): Promise<IAssertPresenceResult> {
    let stdout = "";
    let stderr = "";

    args = args || [];

    const spawnOpts = {
      command,
      args,
      onToken: (tok: string) => { stdout += "\n" + tok; },
      onErrToken: (tok: string) => { stderr += "\n" + tok; },
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
};

export default self;
