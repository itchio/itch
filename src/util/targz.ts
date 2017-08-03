// going through sf to access Electron's original-fs
import { createReadStream, promised } from "../os/sf";

import * as tar from "tar";
import { createGunzip } from "zlib";

interface ITarGzOpts {
  archivePath: string;
  destPath: string;
}

async function extract(opts: ITarGzOpts) {
  const { archivePath, destPath } = opts;

  const untar = tar.Extract(destPath);
  let src = createReadStream(archivePath);

  src.pipe(createGunzip()).pipe(untar);
  return await promised(untar);
}

export default { extract };
