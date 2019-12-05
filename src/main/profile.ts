import { Client } from "butlerd";
import { messages } from "common/butlerd";
import { packets } from "common/packets";
import { queries } from "common/queries";
import dump from "common/util/dump";
import { partitionForUser } from "common/util/partitions";
import { sortBy } from "lodash";
import { broadcastPacket, MainState } from "main";
import { setCookie } from "main/cookie";
import { startDrivingDownloads } from "main/drive-downloads";
import { registerItchProtocol } from "main/itch-protocol";
import { mainLogger } from "main/logger";
import { hookLogging } from "main/start-butler";

const logger = mainLogger.childWithName("profile");

export async function attemptAutoLogin(mainState: MainState) {
  if (!mainState.butler) {
    throw new Error("attempted auto login before butler was ready");
  }

  const client = new Client(mainState.butler.endpoint);

  let { profiles } = await client.call(messages.ProfileList, {});
  if (profiles) {
    logger.info(`${profiles.length} remembered profiles`);

    // most recent first
    profiles = sortBy(profiles, p => -+new Date(p.lastConnected));

    let autoProfile = profiles[0];
    if (autoProfile && autoProfile.user) {
      logger.info(
        `Attempting auto-login for ${autoProfile.user.username} (user ${autoProfile.user.id})`
      );

      try {
        const { profile } = await client.call(
          messages.ProfileUseSavedLogin,
          {
            profileId: profiles[0].id,
          },
          convo => hookLogging(convo, logger)
        );
        await setProfile(mainState, { profile });
      } catch (e) {
        logger.warn(`Auto login failed: ${e.stack}`);
      }
    }
  }
}

export async function setProfile(
  mainState: MainState,
  params: typeof queries.setProfile.__params
) {
  const { profile, cookie } = params;
  if (profile) {
    startDrivingDownloads(mainState);
    registerItchProtocol(mainState, partitionForUser(profile.user.id));
    if (cookie) {
      await setCookie(profile, cookie);
    }
  }
  mainState.profile = profile;
  broadcastPacket(packets.profileChanged, { profile });
}
