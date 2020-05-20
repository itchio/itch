import { packets } from "common/packets";
import { queries } from "common/queries";
import { partitionForUser } from "common/util/partitions";
import { sortBy } from "lodash";
import { MainState } from "main";
import { setCookie } from "main/cookie";
import { startDrivingDownloads } from "main/drive-downloads";
import { registerItchProtocol } from "main/itch-protocol";
import { mainLogger } from "main/logger";
import { hookLogging } from "main/initialize-valet";
import { broadcastPacket } from "main/websocket-handler";
import { MemoryLogger } from "common/logger";
import { Client, messages } from "@itchio/valet";

const logger = mainLogger.childWithName("profile");

export async function attemptAutoLogin(ms: MainState) {
  const client = new Client();

  let { profiles } = await client.call(messages.ProfileList, {});
  if (profiles) {
    logger.debug(`${profiles.length} remembered profiles`);

    // most recent first
    profiles = sortBy(profiles, (p) => -+new Date(p.lastConnected));

    let autoProfile = profiles[0];
    if (autoProfile && autoProfile.user) {
      logger.info(
        `Attempting auto-login for ${autoProfile.user.username} (user ${autoProfile.user.id})`
      );

      let memlogger = new MemoryLogger();
      try {
        const { profile } = await client.call(
          messages.ProfileUseSavedLogin,
          {
            profileId: profiles[0].id,
          },
          (convo) => hookLogging(convo, memlogger)
        );
        await setProfile(ms, { profile });
      } catch (e) {
        logger.warn(
          `Auto login failed: ${e.stack}, log =\n${memlogger.getLog()}`
        );
      }
    }
  }
}

export async function setProfile(
  ms: MainState,
  params: typeof queries.setProfile.__params
) {
  const { profile, cookie } = params;
  if (profile) {
    startDrivingDownloads(ms);
    registerItchProtocol(ms, partitionForUser(profile.user.id));
    if (cookie) {
      await setCookie(profile, cookie);
    }
  }
  ms.profile = profile;
  broadcastPacket(ms, packets.profileChanged, { profile });
}
