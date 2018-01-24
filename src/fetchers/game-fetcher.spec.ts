import suite, { TestWatcher, withDB, actions } from "../test-suite";
import GameFetcher from "./game-fetcher";
import Context from "../context/index";
import { FetchReason } from "./fetcher";
import { Client } from "../api/index";

suite(__filename, s => {
  s.case("fetches game", async t => {
    const w = new TestWatcher();
    await withDB(w.store, async db => {
      const ctx = new Context(w.store, db);

      const game = {
        id: 927,
        title: "Test Game Please Ignore",
        classification: "game",
      };

      const path = `games/${game.id}`;
      const openTabAction = actions.openTab({
        background: false,
        data: { path },
      });
      const { tab } = openTabAction.payload;

      w.store.dispatch(
        actions.loginSucceeded({
          key: "wallop",
          me: {
            id: 123,
          } as any,
        })
      );

      w.store.dispatch(openTabAction);

      const apiClient = new Client();

      const runGameFetcher = async () => {
        const apiMock = t.mock(apiClient);
        apiMock
          .expects("request")
          .once()
          .resolves({
            result: {
              gameId: game.id,
            },
            entities: {
              games: {
                [game.id]: game,
              },
            },
          });

        const f = new GameFetcher();
        f.hook(ctx, tab, FetchReason.TabChanged, { apiClient });
        await f.work();

        apiMock.verify();
      };

      await runGameFetcher();

      const td = () => w.store.getState().session.tabData;
      t.same(
        td()[tab].games.ids,
        [game.id],
        "tabData should list the game's id"
      );
      t.same(
        td()[tab].games.set[game.id].title,
        game.title,
        "tabData should have correct game data"
      );
      t.notOk(
        db.games.findOneById(game.id),
        "should not be saved to DB just yet"
      );

      db.saveOne("games", game.id, {
        ...game,
        classification: "book",
      });
      t.same(
        db.games.findOneById(game.id).classification,
        "book",
        "game used to be a book"
      );

      await runGameFetcher();

      t.same(
        db.games.findOneById(game.id).classification,
        "game",
        "now it's a game again"
      );
    });
  });
});
