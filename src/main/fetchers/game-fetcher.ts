import { Fetcher } from "./fetcher";

import { gameToTabData } from "common/util/navigation";
import { actions } from "common/actions/index";
import { messages, withLogger } from "common/butlerd/index";
import { Game } from "common/butlerd/messages";

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
            window: "root",
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
    const { game } = await call(messages.FetchGame, { gameId });
    pushGame(game);
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
