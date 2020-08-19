import { Watcher } from "common/util/watcher";
import * as url from "common/util/url";

import { actions } from "common/actions";

function buildLoginAndReturnUrl(returnTo: string): string {
  const parsed = url.parse(returnTo);
  const hostname = url.subdomainToDomain(parsed.hostname);

  let urlOpts: Partial<url.UrlWithParsedQuery> = {
    hostname,
    pathname: "/login",
    query: { return_to: returnTo },
  };

  if (hostname === "itch.io") {
    urlOpts.protocol = "https";
  } else {
    urlOpts.port = parsed.port;
    urlOpts.protocol = parsed.protocol;
  }

  return url.format(urlOpts);
}

export default function (watcher: Watcher) {
  watcher.on(actions.initiatePurchase, async (store, action) => {
    const { game } = action.payload;
    const purchaseUrl = game.url + "/purchase";
    const loginPurchaseUrl = buildLoginAndReturnUrl(purchaseUrl);

    store.dispatch(actions.navigate({ wind: "root", url: loginPurchaseUrl }));
  });
}
