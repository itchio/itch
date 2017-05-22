
import urls from "../../constants/urls";

import * as querystring from "querystring";

import * as os from "../../os";
import version from "./version";

import net, {ChecksumAlgo} from "../../api/net";

const CHECKSUM_ALGOS: ChecksumAlgo[] = [
  "SHA256",
  "SHA1",
];

/** platform in go format */
function goos (): string {
  let result = os.platform();
  if (result === "win32") {
    return "windows";
  }
  return result;
}

/** arch in go format */
function goarch () {
  let result = os.arch();
  if (result === "x64") {
    return "amd64";
  } else if (result === "ia32") {
    return "386";
  } else {
    return "unknown";
  }
}

/** build channel URL */
function channel (formulaName: string): string {
  let osArch = `${goos()}-${goarch()}`;
  return `${urls.ibrewRepo}/${formulaName}/${osArch}`;
}

/** fetch latest version number from repo */
async function getLatestVersion (channel: string): Promise<string> {
  const url = `${channel}/LATEST?${querystring.stringify({t: +new Date()})}`;
  const res = await net.request("get", url);

  if (res.statusCode !== 200) {
    throw new Error(`got HTTP ${res.statusCode} while fetching ${url}`);
  }

  const v = res.body.toString("utf8").trim();
  return version.normalize(v);
}

export default {getLatestVersion, channel, goos, goarch, CHECKSUM_ALGOS};
