import { Profile } from "common/butlerd/messages";
import urls from "main/constants/urls";
import * as url from "url";
import { mainLogger } from "main/logger";
import { partitionForUser } from "common/util/partitions";

const logger = mainLogger.childWithName("cookie");

const YEAR_IN_SECONDS =
    365.25 /* days */ * 24 /* hours */ * 60 /* minutes */ * 60 /* seconds */;

export async function setCookie(
  profile: Profile,
  cookie: Record<string, string>
) {
  const partition = partitionForUser(profile.user.id);
  const session = require("electron").session.fromPartition(partition);

  for (const name of Object.keys(cookie)) {
    const value = cookie[name];
    const epoch = Date.now() * 0.001;
    const parsed = url.parse(urls.itchio);
    const opts = {
      name,
      value: encodeURIComponent(value),
      url: `${parsed.protocol}//${parsed.hostname}`,
      domain: "." + parsed.hostname,
      secure: parsed.protocol === "https:",
      httpOnly: true,
      expirationDate: epoch + YEAR_IN_SECONDS, // have it valid for a year
    };
    try {
      await session.cookies.set(opts);
    } catch (error) {
      logger.error(`Cookie error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
