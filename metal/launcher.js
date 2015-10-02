(function() {
  var AppActions, Promise, child_process, escape, launch, path, sh;

  path = require("path");

  child_process = require("child_process");

  Promise = require("bluebird");

  AppActions = require("./actions/AppActions");

  sh = function(exe_path, cmd) {
    return new Promise(function(resolve, reject) {
      var bidden, exe, forbidden, i, len, wd;
      console.log("sh " + cmd);
      forbidden = [";", "&&"];
      for (i = 0, len = forbidden.length; i < len; i++) {
        bidden = forbidden[i];
        if (cmd.indexOf(bidden) >= 0) {
          throw new Error("Command-line contains forbidden characters: " + cmd);
        }
      }
      wd = path.dirname(exe_path);
      console.log("Working directory: " + wd);
      return exe = child_process.exec(cmd, {
        stdio: [0, 'pipe', 'pipe'],
        maxBuffer: 5000 * 1024,
        cwd: wd
      }, function(error, stdout, stderr) {
        if (error) {
          console.log(exe_path + " returned " + error);
          console.log("stdout: ");
          console.log(stdout);
          console.log("stderr: ");
          console.log(stderr);
          return reject({
            exe_path: exe_path,
            error: error
          });
        } else {
          return resolve("Done playing " + exe_path + "!");
        }
      });
    });
  };

  escape = function(arg) {
    return '"' + arg.replace(/"/g, "\\\"") + '"';
  };

  launch = function(exe_path, args) {
    var arg_string, shell;
    if (args == null) {
      args = [];
    }
    console.log("launching '" + exe_path + "' on '" + process.platform + "' with args '" + (args.join(' ')) + "'");
    arg_string = args.map(function(x) {
      return escape(x);
    }).join(' ');
    switch (process.platform) {
      case "darwin":
        return sh(exe_path, "open -W " + (escape(exe_path)) + " --args " + arg_string);
      case "win32":
      case "linux":
        return sh(exe_path, (escape(exe_path)) + " " + arg_string);
      default:
        shell = require("shell");
        shell.openItem(exe_path);
        return Promise.resolve("Opened " + exe_path + " in shell!");
    }
  };

  module.exports = {
    launch: launch
  };

}).call(this);

//# sourceMappingURL=../app/maps/metal/launcher.js.map
