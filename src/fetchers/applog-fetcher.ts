import { Fetcher } from "./fetcher";
import { mainLogPath } from "../os/paths";
import * as sf from "../os/sf";

class AppLogFetcher extends Fetcher {
  async work(): Promise<void> {
    const logPath = mainLogPath();
    const log = await sf.readFile(logPath, { encoding: "utf8" });
    this.push({
      log: {
        log,
      },
    });
  }
}

export default AppLogFetcher;
