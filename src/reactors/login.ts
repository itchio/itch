import { Watcher } from "./watcher";
import { actions } from "../actions";

import { promisedModal } from "./modals";
import urls from "../constants/urls";
import * as urlParser from "url";

import { modalWidgets } from "../components/modal-widgets/index";
import { withButlerClient, messages } from "../buse/index";
import partitionForUser from "../util/partition-for-user";
import { Profile } from "../buse/messages";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "login" });

export default function(watcher: Watcher) {
  watcher.on(actions.loginWithPassword, async (store, action) => {
    const { username, password } = action.payload;
    store.dispatch(actions.attemptLogin({}));
    try {
      await withButlerClient(logger, async client => {
        client.onRequest(messages.ProfileRequestCaptcha, async ({ params }) => {
          const modalRes = await promisedModal(
            store,
            modalWidgets.recaptchaInput.make({
              title: "Captcha",
              message: "",
              widgetParams: {
                url: params.recaptchaUrl || urls.itchio + "/captcha",
              },
              fullscreen: true,
            })
          );

          if (modalRes) {
            return { recaptchaResponse: modalRes.recaptchaResponse };
          } else {
            // abort
            return { recaptchaResponse: null };
          }
        });

        client.onRequest(messages.ProfileRequestTOTP, async ({ params }) => {
          const modalRes = await promisedModal(
            store,
            modalWidgets.twoFactorInput.make({
              title: ["login.two_factor.title"],
              message: "",
              buttons: [
                {
                  label: ["login.action.login"],
                  action: "widgetResponse",
                },
                {
                  label: ["login.two_factor.learn_more"],
                  action: actions.openUrl({
                    url: urls.twoFactorHelp,
                  }),
                  className: "secondary",
                },
              ],
              widgetParams: {
                username,
              },
            })
          );

          if (modalRes) {
            return { code: modalRes.totpCode };
          } else {
            // abort
            return { code: null };
          }
        });

        const { profile, cookie } = await client.call(
          messages.ProfileLoginWithPassword({
            username,
            password,
          })
        );

        if (cookie) {
          try {
            await setCookie(profile, cookie);
          } catch (e) {
            logger.error(`Could not set cookie: ${e.stack}`);
          }
        }

        store.dispatch(actions.loginSucceeded({ profile }));
      });
    } catch (e) {
      store.dispatch(actions.loginFailed({ username, errors: [e.message] }));
    }
  });

  watcher.on(actions.useSavedLogin, async (store, action) => {
    await withButlerClient(logger, async client => {
      store.dispatch(actions.attemptLogin({}));

      try {
        const { profile } = await client.call(
          messages.ProfileUseSavedLogin({
            profileId: action.payload.profile.id,
          })
        );

        store.dispatch(actions.loginSucceeded({ profile }));
      } catch (e) {
        // TODO: handle offline login
        const originalProfile = action.payload.profile;
        store.dispatch(
          actions.loginFailed({
            username: originalProfile.user.username,
            errors: e.errors || e.stack || e,
          })
        );
      }
    });
  });
}

const YEAR_IN_SECONDS =
  365.25 /* days */ * 24 /* hours */ * 60 /* minutes */ * 60 /* seconds */;

async function setCookie(profile: Profile, cookie: Map<string, string>) {
  const partition = partitionForUser(String(profile.user.id));
  const session = require("electron").session.fromPartition(partition, {
    cache: false,
  });

  for (const name of Object.keys(cookie)) {
    const value = cookie[name];
    const epoch = Date.now() * 0.001;
    await new Promise((resolve, reject) => {
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
      logger.debug(`Setting cookie: ${JSON.stringify(opts)}`);
      session.cookies.set(opts, (error: Error) => {
        if (error) {
          logger.error(`Cookie error: ${JSON.stringify(error)}`);
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}
