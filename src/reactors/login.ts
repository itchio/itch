import { Watcher } from "./watcher";
import { actions } from "../actions";

import { sortBy } from "underscore";

import { promisedModal } from "./modals";
import urls from "../constants/urls";
import * as urlParser from "url";

import { modalWidgets } from "../components/modal-widgets/index";
import { withButlerClient, messages } from "../buse/index";
import partitionForUser from "../util/partition-for-user";
import { Session } from "../buse/messages";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "login" });

export default function(watcher: Watcher) {
  watcher.on(actions.loginWithPassword, async (store, action) => {
    const { username, password } = action.payload;
    store.dispatch(actions.attemptLogin({}));
    try {
      await withButlerClient(async client => {
        client.onRequest(messages.SessionRequestCaptcha, async ({ params }) => {
          const modalRes = await promisedModal(
            store,
            modalWidgets.recaptchaInput.make({
              title: "Captcha",
              message: "",
              widgetParams: {
                url: params.recaptchaUrl || urls.itchio + "/captcha",
              },
            })
          );

          if (modalRes) {
            return { recaptchaResponse: modalRes.recaptchaResponse };
          } else {
            // abort
            return { recaptchaResponse: null };
          }
        });

        client.onRequest(messages.SessionRequestTOTP, async ({ params }) => {
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

        const { session, cookie } = await client.call(
          messages.SessionLoginWithPassword({
            username,
            password,
          })
        );

        if (cookie) {
          try {
            await setCookie(session, cookie);
          } catch (e) {
            logger.error(`Could not set cookie: ${e.stack}`);
          }
        }

        store.dispatch(actions.loginSucceeded({ session }));
      });
    } catch (e) {
      store.dispatch(actions.loginFailed({ username, errors: [e.message] }));
    }
  });

  watcher.on(actions.useSavedLogin, async (store, action) => {
    await withButlerClient(async client => {
      store.dispatch(actions.attemptLogin({}));

      try {
        const { session } = await client.call(
          messages.SessionUseSavedLogin({
            sessionID: action.payload.session.id,
          })
        );

        store.dispatch(actions.loginSucceeded({ session }));
      } catch (e) {
        // TODO: handle offline login
        const originalSession = action.payload.session;
        store.dispatch(
          actions.loginFailed({
            username: originalSession.user.username,
            errors: e.errors || e.stack || e,
          })
        );
      }
    });
  });

  watcher.on(actions.sessionsRemembered, async (store, action) => {
    const rememberedSessions = action.payload;
    const mostRecentSession = sortBy(
      rememberedSessions.sessions,
      x => -x.lastConnected
    )[0];
    if (mostRecentSession) {
      store.dispatch(actions.useSavedLogin({ session: mostRecentSession }));
    }
  });
}

const YEAR_IN_SECONDS =
  365.25 /* days */ * 24 /* hours */ * 60 /* minutes */ * 60 /* seconds */;

async function setCookie(itchSession: Session, cookie: Map<string, string>) {
  const partition = partitionForUser(String(itchSession.user.id));
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
