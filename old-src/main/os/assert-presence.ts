import spawn from "main/os/spawn";
import { Context } from "main/context";

import { devNull, RecordingLogger } from "common/logger";
import { formatExitCode } from "common/format/exit-code";
import { mainLogger } from "main/logger";

interface AssertPresenceResult {
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
  extraOpts = {} as any
): Promise<AssertPresenceResult> {
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
    logger: new RecordingLogger(mainLogger, "assert-presence"),
    ctx,
  };

  const code = await spawn(spawnOpts);
  if (code !== 0) {
    throw new Error(
      `${command} exited with code ${formatExitCode(
        code
      )}\n${stdout}\n${stderr}`
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
