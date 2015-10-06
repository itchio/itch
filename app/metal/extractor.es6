
import read_chunk from "read-chunk";
import file_type from "file-type";
import Promise from "bluebird";

export function extract (archive_path, dest_path) {
  let buffer = read_chunk.sync(archive_path, 0, 262);
  let type = file_type(buffer);

  console.log(`type for ${archive_path}: ${JSON.stringify(type)}`);

  switch (type.ext) {
    case 'zip':
    case 'gz':
    case 'bz2':
    case '7z':
      return require("./extractors/7zip").extract(archive_path, dest_path);
    default:
      let p = Promise.reject(`Don't know how to extract ${archive_path} / ${JSON.stringify(type)}`)
      p.progress = () => p;
      return p;
  }
}

export default {
  extract
};

