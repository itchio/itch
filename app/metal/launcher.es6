
import shell from "shell";
import path from "path";
import child_process from "child_process";
import Promise from "bluebird";

import AppActions from "./actions/app_actions";

function sh (exe_path, cmd) {
  return new Promise((resolve, reject) => {
    console.log(`sh ${cmd}`);

    // pretty weak but oh well.
    let forbidden = [";", "&&"];
    for (let bidden of forbidden) {
      if (cmd.indexOf(bidden) >= 0) {
        throw new Error(`Command-line contains forbidden characters: ${cmd}`);
      }
    }

    let cwd = path.dirname(exe_path);
    console.log(`Working directory: ${cwd}`);

    child_process.exec(cmd, {
      stdio: [ 0, 'pipe', 'pipe' ],
      maxBuffer: 5000 * 1024,
      cwd
    }, (error, stdout, stderr) => {
      if (error) {
        console.log("#{exe_path} returned #{error}");
        console.log("stdout: ");
        console.log(stdout);
        console.log("stderr: ");
        console.log(stderr);
        reject({ exe_path, error });
      } else {
        resolve(`Done playing ${exe_path}!`);
      }
    });
  });
}

function escape (arg) {
  return '"' + arg.replace(/"/g, "\\\"") + '"';
}

export function launch (exe_path, args=[]) {
  console.log(`launching '${exe_path}' on '${process.platform}' with args '${args.join(' ')}'`);
  let arg_string = args.map((x) => escape(x)).join(' ');

  switch (process.platform) {
    case "darwin":
      // '-W' waits for app to quit
      // potentially easy to inject something into the command line
      // here but then again we are running executables downloaded
      // from the internet.
      return sh(exe_path, `open -W ${escape(exe_path)} --args ${arg_string}`);

    case "win32":
    case "linux":
      return sh(exe_path, `${escape(exe_path)} ${arg_string}`);

    default:
      // don't know how to launch, try to open with OS?
      shell.openItem(exe_path);
      return Promise.resolve(`Opened ${exe_path} in shell!`);
  }
}

module.exports = { launch }

