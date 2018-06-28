import { Logger, MakeLoggerOpts, LOG_LEVEL } from "common/logger";
import write from "./write-renderer";

export function makeLogger({ logPath, customOut }: MakeLoggerOpts): Logger {
  return new Logger({
    write,
    level: LOG_LEVEL,
  });
}
