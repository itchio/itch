import { Fetcher } from "./fetcher";

import { gameToTabData } from "../util/navigation";
import { actions } from "../actions/index";
import { withButlerClient, messages } from "../buse/index";
import { Game } from "../buse/messages";

// TODO: save password & secret, see
// https://github.com/itchio/itch/issues/1080

export default class GameFetcher extends Fetcher {
  async work(): Promise<void> {
    const sp = this.space();

    let isInternal = sp.internalPage() === "games";
    const gameId = isInternal ? sp.firstPathNumber() : sp.numericId();

    const pushGame = (game: Game) => {
      if (!game) {
        return;
      }

      if (isInternal) {
        isInternal = false;
        // we need to turn that into an https URL presto
        this.ctx.store.dispatch(
          actions.evolveTab({
            tab: this.tab,
            url: game.url,
            resource: `games/${gameId}`,
            replace: true,
          })
        );
      }
      this.push(gameToTabData(game));
    };

    await withButlerClient(this.logger, async client => {
      client.onNotification(messages.FetchGameYield, async ({ params }) => {
        pushGame(params.game);
      });

      await client.call(
        messages.FetchGame({
          profileId: this.profileId(),
          gameId,
        })
      );
      this.debug("Done calling butler");
    });
  }

  clean() {
    this.push(
      {
        users: null,
        games: null,
      },
      { shallow: true }
    );
  }
}
