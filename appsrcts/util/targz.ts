
// going through sf to access original-fs when running via Electron
import sf from "./sf";

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
