import spawn from "./spawn";
import Context from "../context";

import { devNull } from "../logger";

interface IAssertPresenceResult {
  code: number;
  stdout: string;
  stderr: string;
  parsed: string;
}

export async function assertPresence(
  ctx: Context,
  command: string,
  args: string[],
  parser: RegExp,
  extraOpts = {} as any,
): Promise<IAssertPresenceResult> {
  let stdout = "";
  let stderr = "";

  args = args || [];

  const spawnOpts = {
    command,
    args,
    onToken: (tok: string) => {
      stdout += "\n" + tok;
    },
    onErrToken: (tok: string) => {
      stderr += "\n" + tok;
    },
    opts: extraOpts,
    logger: devNull,
    ctx,
  };

  const code = await spawn(spawnOpts);
  if (code !== 0) {
    throw new Error(
      `${command} exited with code ${code}\n${stdout}\n${stderr}`,
    );
  }

  let parsed: string = null;
  if (parser) {
    let matches = parser.exec(stdout + "\n" + stderr);
    if (matches) {
      parsed = matches[1];
    }
  }

  return { code, stdout, stderr, parsed };
}

export default assertPresence;
