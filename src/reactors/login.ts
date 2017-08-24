import { Watcher } from "./watcher";
import * as actions from "../actions";

import client from "../api";
import partitionForUser from "../util/partition-for-user";

import { sortBy } from "underscore";

import { promisedModal } from "./modals";
import { MODAL_RESPONSE } from "../constants/action-types";
import urls from "../constants/urls";
import * as urlParser from "url";
import { isNetworkError } from "../net/errors";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "login" });

import { ITwoFactorInputParams } from "../components/modal-widgets/two-factor-input";

const YEAR_IN_SECONDS =
  365.25 /* days */ * 24 /* hours */ * 60 /* minutes */ * 60 /* seconds */;

export default function(watcher: Watcher) {
  watcher.on(actions.loginWithPassword, async (store, action) => {
    const { username, password } = action.payload;

    store.dispatch(actions.attemptLogin({}));

    try {
      let res = await client.loginWithPassword(username, password);
      if (res.totpNeeded) {
        const modalRes = await promisedModal(store, {
          title: ["login.two_factor.title"],
          message: "",
          buttons: [
            {
              label: ["login.action.login"],
              action: actions.modalResponse({}),
              actionSource: "widget",
            },
            {
              label: ["login.two_factor.learn_more"],
              action: actions.openUrl({
                url: urls.twoFactorHelp,
              }),
              className: "secondary",
            },
          ],
          widget: "two-factor-input",
          widgetParams: {
            username,
          } as ITwoFactorInputParams,
        });

        if (modalRes.type === MODAL_RESPONSE) {
          const totpCode = modalRes.payload.totpCode;
          res = await client.loginWithPassword(username, password, totpCode);
        } else {
          store.dispatch(actions.loginCancelled({}));
          return;
        }
      }

      const key = res.key.key;
      const keyClient = client.withKey(key);

      // login returns a cookie, set it into our web session so that we're
      // seamlessly logged into the app.
      if (res.cookie) {
        const partition = partitionForUser(String(res.key.userId));
        const session = require("electron").session.fromPartition(partition, {
          cache: false,
        });

        for (const name of Object.keys(res.cookie)) {
          const value = res.cookie[name];
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
            logger.debug(`Setting cookie: `, opts);
            session.cookies.set(opts, (error: Error) => {
              if (error) {
                logger.error(`Cookie error: `, error);
                logger.error(`Cookie error stack: `, error.stack);
                reject(error);
              } else {
                resolve();
              }
            });
          });
        }
      }

      // validate API key and get user profile in one fell swoop
      const me = (await keyClient.me()).user;
      store.dispatch(actions.loginSucceeded({ key, me }));
    } catch (e) {
      store.dispatch(
        actions.loginFailed({ username, errors: e.errors || e.stack || e })
      );
    }
  });

  watcher.on(actions.loginWithToken, async (store, action) => {
    const { username, key } = action.payload;

    store.dispatch(actions.attemptLogin({}));

    try {
      const keyClient = client.withKey(key);

      // validate API key and get user profile in one fell swoop
      const me = (await keyClient.me()).user;
      store.dispatch(actions.loginSucceeded({ key, me }));
    } catch (e) {
      const { me } = action.payload;
      if (me && isNetworkError(e)) {
        // log in anyway
        store.dispatch(actions.loginSucceeded({ key, me }));
      } else {
        store.dispatch(
          actions.loginFailed({ username, errors: e.errors || e.stack || e })
        );
      }
    }
  });

  watcher.on(actions.sessionsRemembered, async (store, action) => {
    const rememberedSessions = action.payload;
    const mostRecentSession = sortBy(
      rememberedSessions,
      x => -x.lastConnected
    )[0];
    if (mostRecentSession) {
      const { me, key } = mostRecentSession;
      const { username } = me;
      store.dispatch(actions.loginWithToken({ username, key, me }));
    }
  });
}
