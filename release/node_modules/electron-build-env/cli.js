#!/usr/bin/env node

var build = require("./index.js");
var program = require('commander');

var options = process.argv.slice(0, 2);
var command;

if (process.argv.length > 2 && process.argv[2].startsWith("-")) {
  for (var i = 2; i < process.argv.length && process.argv[i] !== "--"; i++) {
    options.push(process.argv[i]);
  }
  command = process.argv.slice(i + 1);
} else {
  command = process.argv.slice(2);
}

program
  .version(require("./package.json").version)
  .usage("[options --] <command...>")
  .arguments("<command...>")
  .option("--electron <version>", "Electron version")
  .option("--arch <arch>",        "target architecture")
  .option("--disturl <url>",      "Electron headers URL")
  .option("--devdir <path>",      "Electron headers cache directory")
  .parse(options);

if (command.length === 0) {
  program.help();
}

build(command, {
  electron: program.electron,
  arch: program.arch,
  disturl: program.disturl,
  devdir: program.devdir
}, (err) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }
});
