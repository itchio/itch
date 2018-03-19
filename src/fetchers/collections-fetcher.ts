import { Fetcher } from "./fetcher";

import { indexBy, pluck } from "underscore";
import { withButlerClient, messages } from "../buse";
import { Collection } from "../buse/messages";

class CollectionsFetcher extends Fetcher {
  constructor() {
    super();
  }

  async work(): Promise<void> {
    if (!this.warrantsRemote()) {
      return;
    }

    await withButlerClient(this.logger, async client => {
      client.onNotification(
        messages.FetchProfileCollectionsYield,
        async ({ params }) => {
          const colls: Collection[] = params.items;
          this.push({
            collections: {
              set: indexBy(colls, "id"),
              ids: pluck(colls, "id"),
            },
          });
        }
      );

      await client.call(
        messages.FetchProfileCollections({
          profileId: this.profileId(),
        })
      );
    });
  }
}

export default CollectionsFetcher;
