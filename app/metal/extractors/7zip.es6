
import Promise from "bluebird";
import file_type from "file-type";
import read_chunk from "read-chunk";
import path from "path";
import sevenzip from "node-7z";
import Humanize from "humanize-plus";

let glob = Promise.promisify(require("glob"));
let fs = Promise.promisifyAll(require("fs"));

function normalize (p) {
  return path.normalize(p.replace(/[\s]*$/, ""));
}

function is_tar (file) {
  let type = file_type(read_chunk.sync(file, 0, 262))
  return type && type.ext == 'tar';
}

let VERY_VERBOSE = false;

function log (msg) {
  if (!VERY_VERBOSE) return;
  console.log(msg);
}

export function extract (archive_path, dest_path) {
  let handlers = {
    onprogress: () => null
  };

  let p = new Promise((resolve, reject) => {
    log(`Extracting archive '${archive_path}' to '${dest_path}' with 7-Zip`);
    let li = new sevenzip().list(archive_path);

    let sizes = {};
    let total_size = 0;
    let extracted_size = 0;

    li.progress((files) => {
      log(`Got info about ${files.length} files`);
      for (let f of files) {
        total_size += f.size
        let npath = normalize(f.name);
        sizes[npath] = f.size;
        log(`${npath} (${f.size} bytes)`);
      }
    });

    li.then((spec) => {
      log(`total extracted size: ${total_size}`);
      log(`spec = \n${JSON.stringify(spec)}`);

      let xr = new sevenzip().extractFull(archive_path, dest_path);

      xr.progress((files) => {
        log(`Got progress about ${files.length} files`)
        for (let f of files) {
          let npath = normalize(f);
          let size = sizes[npath]
          if (size) {
            extracted_size += size
            log(`${npath} (${size} bytes)`);
          } else {
            log(`${npath} (size not found)`);
          }
        }
        let percent = Math.round(extracted_size / total_size * 100);
        log(`Estimated progress: ${Humanize.fileSize(extracted_size)} of ${Humanize.fileSize(total_size)} bytes, ~${percent}%`)
        handlers.onprogress({
          extracted_size,
          total_size,
          percent
        });
      });

      return xr
    }).then(() => {
      return glob(`${dest_path}/**/*`, {nodir: true})
    }).then((files) => {
      if (files.length == 1 && is_tar(files[0])) {
        let tar = files[0];
        log(`Found tar: '${tar}'`);
        log(`With dest_path '${dest_path}'`);
        return extract(tar, dest_path).then((res) => {
          resolve(fs.unlinkAsync(tar).then(() => res));
        });
      } else {
        resolve({total_size});
      }
    }).catch((e) => {
      reject(e);
    });
  });

  p.progress = (callback) => {
    handlers.onprogress = callback;
    return p;
  }

  return p;
}

