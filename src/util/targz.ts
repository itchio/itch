
// going through sf to access Electron's original-fs
import sf from "../os/sf";

import * as tar from "tar";
import * as zlib from "zlib";

interface ITarGzOpts {
  archivePath: string;
  destPath: string;
}

async function extract (opts: ITarGzOpts) {
  const {archivePath, destPath} = opts;

  const untar = tar.Extract(destPath);
  let src = sf.fs.createReadStream(archivePath);

  src.pipe(zlib.createGunzip()).pipe(untar);
  return await sf.promised(untar);
}

export default {extract};
