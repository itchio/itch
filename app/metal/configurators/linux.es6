
import Promise from "bluebird"
import path from "path";
import _ from "underscore";

let fs = Promise.promisifyAll(require("fs"));
let glob = Promise.promisify(require("glob"));
let read_chunk = Promise.promisify(require("read-chunk"));

function log (msg) {
  console.log(`[configurators/linux] ${msg}`);
}

function sniff_format (buf) {
  // ELF executables start with 0x7F454C46
  // (e.g. 0x7F + 'ELF' in ASCII)
  if (buf[0] == 0x7F && buf[1] == 0x45 && buf[2] == 0x4C && buf[3] == 0x46) {
    return 'elf executable';
  }

  // Shell scripts start with an interro-bang
  if (buf[0] == 0x23 && buf[1] == 0x21) {
    return 'shell script';
  }

  return null;
}

function find_and_fix_execs (app_path) {
  return glob(`${app_path}/**/*`, {nodir: true}).then((all_files) => {
    log(`Probing ${all_files.length} files for executables`);
    return all_files;
  }).map((file) => {
    return read_chunk(file, 0, 8).then(sniff_format).then((format) => {
      if (!format) return null;
      let short_path = path.relative(app_path, file);
      log(`${short_path} looks like a ${format}, +x'ing it`);
      return fs.chmodAsync(file, 0o777).then(() => file)
    });
  }, {concurrency: 4}).filter((x) => !!x)
}

export function configure (app_path) {
  return find_and_fix_execs(app_path)
    .then((executables) => {
      return {executables};
    });
}

