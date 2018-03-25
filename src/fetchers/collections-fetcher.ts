import { Fetcher } from "./fetcher";

import { indexBy, pluck } from "underscore";
import { messages, withLogger } from "../butlerd";

class CollectionsFetcher extends Fetcher {
  constructor() {
    super();
  }

  async work(): Promise<void> {
    if (!this.warrantsRemote()) {
      return;
    }

    const call = withLogger(this.logger);
    await call(
      messages.FetchProfileCollections,
      {
        profileId: this.profileId(),
      },
      client => {
        client.on(messages.FetchProfileCollectionsYield, async ({ items }) => {
          this.push({
            collections: {
              set: indexBy(items, "id"),
              ids: pluck(items, "id"),
            },
          });
        });
      }
    );
  }
}

export default CollectionsFetcher;
