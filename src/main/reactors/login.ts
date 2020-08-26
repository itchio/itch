import { actions } from "common/actions";
import { messages, hookLogging } from "common/butlerd";
import { Profile } from "common/butlerd/messages";
import urls from "common/constants/urls";
import { Store } from "common/types";
import { partitionForUser } from "common/util/partition-for-user";
import { Watcher } from "common/util/watcher";
import { mcall } from "main/butlerd/mcall";
import { mainLogger } from "main/logger";
import { modals } from "common/modals";
import urlParser from "url";
import { promisedModal } from "main/reactors/modals";
import { restoreTabs, saveTabs } from "main/reactors/tab-save";
import { registerItchProtocol } from "main/net/register-itch-protocol";
import { session } from "electron";
import { elapsed } from "common/format/datetime";
import { withTimeout } from "common/helpers/with-timeout";

const logger = mainLogger.child(__filename);
const LOGIN_TIMEOUT = 5 * 1000; // 5 seconds

export default function (watcher: Watcher) {
  watcher.on(actions.loginWithPassword, async (store, action) => {
    const { username, password } = action.payload;

    logger.info(`Attempting password login for user ${username}`);
    store.dispatch(actions.attemptLogin({}));

    try {
      // integration tests for the integration test goddess
      if (username === "#api-key") {
        logger.info(`Doing direct API key login...`);
        const { profile } = await withTimeout(
          "API key login",
          LOGIN_TIMEOUT,
          mcall(messages.ProfileLoginWithAPIKey, {
            apiKey: password,
          })
        );
        logger.debug(`ProfileLoginWithAPIKey call succeeded`);
        await loginSucceeded(store, profile);
        return;
      }

      logger.info(`Doing username/password login...`);
      const { profile, cookie } = await mcall(
        messages.ProfileLoginWithPassword,
        {
          username,
          password,
          forceRecaptcha: process.env.ITCH_FORCE_RECAPTCHA === "1",
        },
        (client) => {
          logger.debug(`Setting up handlers for TOTP & captcha`);
          client.onRequest(
            messages.ProfileRequestCaptcha,
            async ({ recaptchaUrl }) => {
              logger.info(`Showing captcha`);
              const modalRes = await promisedModal(
                store,
                modals.recaptchaInput.make({
                  wind: "root",
                  title: "Captcha",
                  message: "",
                  widgetParams: {
                    url: recaptchaUrl || urls.itchio + "/captcha",
                  },
                  fullscreen: true,
                })
              );

              if (modalRes) {
                logger.info(`Captcha solved`);
                return { recaptchaResponse: modalRes.recaptchaResponse };
              } else {
                // abort
                logger.info(`Captcha cancelled`);
                return { recaptchaResponse: null };
              }
            }
          );

          client.onRequest(messages.ProfileRequestTOTP, async () => {
            logger.info(`Showing TOTP`);
            const modalRes = await promisedModal(
              store,
              modals.twoFactorInput.make({
                wind: "root",
                title: ["login.two_factor.title"],
                message: "",
                widgetParams: {
                  username,
                },
              })
            );

            if (modalRes) {
              logger.info(`TOTP answered`);
              return { code: modalRes.totpCode };
            } else {
              // abort
              logger.info(`TOTP cancelled`);
              return { code: null };
            }
          });
        }
      );

      if (cookie) {
        try {
          logger.info(`Setting cookies...`);
          await setCookie(profile, cookie);
        } catch (e) {
          logger.error(`Could not set cookie: ${e.stack}`);
        }
      }

      await loginSucceeded(store, profile);
    } catch (e) {
      logger.error(`Password login failed: ${e.stack}`);
      store.dispatch(actions.loginFailed({ username, error: e }));
    }
  });

  watcher.on(actions.useSavedLogin, async (store, action) => {
    const profileId = action.payload.profile.id;
    logger.info(`Attempting saved login for profile ${profileId}`);
    store.dispatch(actions.attemptLogin({}));

    try {
      const { profile } = await withTimeout(
        "Saved login",
        LOGIN_TIMEOUT,
        mcall(
          messages.ProfileUseSavedLogin,
          {
            profileId,
          },
          (convo) => {
            hookLogging(convo, logger);
          }
        )
      );
      logger.info(`Saved login succeeded!`);
      await loginSucceeded(store, profile);
    } catch (e) {
      // TODO: handle offline login
      const originalProfile = action.payload.profile;
      store.dispatch(
        actions.loginFailed({
          username: originalProfile.user.username,
          error: e,
        })
      );
    }
  });

  watcher.on(actions.requestLogout, async (store, action) => {
    await saveTabs(store);
    store.dispatch(actions.loggedOut({}));
  });
}

const YEAR_IN_SECONDS =
  365.25 /* days */ * 24 /* hours */ * 60 /* minutes */ * 60; /* seconds */

async function setCookie(profile: Profile, cookie: { [key: string]: string }) {
  const partition = partitionForUser(String(profile.user.id));
  const session = require("electron").session.fromPartition(partition, {
    cache: false,
  });

  for (const name of Object.keys(cookie)) {
    const value = cookie[name];
    const epoch = Date.now() * 0.001;
    const parsed = urlParser.parse(urls.itchio);
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

async function loginSucceeded(store: Store, profile: Profile) {
  logger.info(`Login succeeded, setting up session`);
  try {
    const userId = profile.id;
    const partition = partitionForUser(String(userId));
    const customSession = session.fromPartition(partition, { cache: true });
    logger.info(`Registering itch protocol for session ${partition}`);
    registerItchProtocol(store, customSession);
  } catch (e) {
    logger.warn(`Could not register itch protocol for session: ${e.stack}`);
  }

  try {
    logger.info(`Restoring tabs...`);
    await restoreTabs(store, profile);
  } catch (e) {
    logger.warn(`Could not restore tabs: ${e.stack}`);
  }

  logger.info(`Dispatching login succeeded`);
  store.dispatch(actions.loginSucceeded({ profile }));

  try {
    logger.info(`Fetching owned keys...`);
    let t1 = Date.now();
    await mcall(
      messages.FetchProfileOwnedKeys,
      {
        profileId: profile.id,
        fresh: true,
        limit: 1,
      },
      (convo) => {
        hookLogging(convo, logger);
      }
    );
    let t2 = Date.now();
    logger.info(`Fetched owned keys in ${elapsed(t1, t2)}`);
    store.dispatch(actions.ownedKeysFetched({}));
  } catch (e) {
    logger.warn(`In initial owned keys fetch: ${e.stack}`);
  }
}
