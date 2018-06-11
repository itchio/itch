import { Fetcher, FetchReason } from "./fetcher";

import { indexBy, pluck } from "underscore";
import { messages, withLogger } from "common/butlerd";

class CollectionsFetcher extends Fetcher {
  constructor() {
    super();
  }

  async work(): Promise<void> {
    const call = withLogger(this.logger);
    const { items } = await call(messages.FetchProfileCollections, {
      profileId: this.profileId(),
      limit: 3,
      ignoreCache: this.reason == FetchReason.TabReloaded,
    });
    if (items) {
      this.push({
        collections: {
          set: indexBy(items, "id"),
          ids: pluck(items, "id"),
        },
      });
    }
  }
}

export default CollectionsFetcher;
