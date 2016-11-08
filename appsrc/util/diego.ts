
/* Diego is your little diagnostics mercenary! */
import mklog from "./log";
const realLog = mklog("diego");
import os from "./os";
import spawn from "./spawn";

import {Logger} from "./log";

const promisedDiego = collect();

async function collect () {
  let output = "";

  const log = (msg: string): void => {
    output += msg + "\n";
  };

  // privacy setting: add 'export DIEGO_IS_ASLEEP' to your ~/.bashrc, ~/.zshrc etc.
  // to make sure diego never looks around.
  // note that, logs don't leave your computer unless you post them yourself on the
  // issue tracker for example, but I figured it's easy for us to provide a way
  // to turn it off
  if (process.env.DIEGO_IS_ASLEEP) {
    log("diego is asleep.");
    return;
  }

  log("diego here, looking around");

  const dump = async function (full: string, re = /.*/) {
    // for our purpose, no need to worry about escaping arguments.
    let args = full.split(" ");
    let command = args.shift();
    try {
      await spawn({
        command, args, onToken: (tok) => (re.test(tok) && log(tok)),
      });
    } catch (e) { log(`"${full}" resisted us: ${e.message || "?"}`); }
  };

  switch (os.itchPlatform()) {
    case "windows": {
      await dump("wmic OS get Caption, Version, OSArchitecture");
      // weirdest syntax ever, 'name,' and 'caption,' are separate arguments...
      await dump("wmic cpu get Name, Caption, MaxClockSpeed");
      await dump("wmic path Win32_VideoController get Name");
      break;
    }
    case "linux": {
      await dump("uname -a");
      await dump("cat /proc/cpuinfo", /model name/);
      await dump("lsb_release -a");
      await dump("lspci", /VGA compatible/);
      break;
    }
    case "osx": {
      await dump("uname -a");
      await dump("sw_vers");
      await dump("system_profiler SPHardwareDataType SPDisplaysDataType");
      break;
    }
    default: {
      log(`unknown platform ${os.itchPlatform()}`);
      break;
    }
  }

  log("diego out");
  return output;
}

interface IDiegoOpts {
  logger: Logger;
}

const self = {
  hire: async function (opts: IDiegoOpts): Promise<void> {
    const output = await promisedDiego; // sic. no parenthesis — called once on startup
    realLog(opts, output);
  },
};

export default self;
