import { Fetcher } from "./fetcher";

import { gameToTabData } from "../util/navigation";
import { actions } from "../actions/index";
import { messages, withLogger } from "../buse/index";
import { Game } from "../buse/messages";

// TODO: save password & secret, see
// https://github.com/itchio/itch/issues/1080

class GameFetcher extends Fetcher {
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

    let call = withLogger(this.logger);
    await call(messages.FetchGame, { gameId }, client => {
      client.on(messages.FetchGameYield, async ({ game }) => pushGame(game));
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

export default GameFetcher;
