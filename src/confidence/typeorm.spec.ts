import suite from "../test-suite";

import {
  createConnection,
  getConnectionManager,
  Entity,
  Column,
  PrimaryColumn,
} from "typeorm";
import deepEquals = require("deep-equal");
import * as _ from "underscore";

@Entity()
class Game {
  @PrimaryColumn("int") id: number;

  @Column("text") title: string;

  @Column("text") shortDesc: string;
}

// This test appears slower than it is because typeorm
// dynamically requires sqlite
suite(__filename, s => {
  s.case("run a few queries", async t => {
    const startedAt = Date.now();

    const name = "default";
    try {
      await getConnectionManager().get(name).close();
    } catch (e) {
      // something like connection not found or whatever
    }
    const conn = await createConnection({
      name,
      driver: {
        type: "sqlite",
        storage: ":memory:",
      },
      entities: [Game],
      autoSchemaSync: true,
    });
    const migratedAt = Date.now();
    t.comment(`sync'd in ${(migratedAt - startedAt).toFixed(2)}ms`);

    const gameRepo = conn.getRepository(Game);

    let gameData = [
      [1, "Overland", "Everything is on fire"],
      [2, "Puzzle Puppers", "Drag out doggos!"],
      [3, "Thorny Weather", "Underrated puzzle game"],
      [4, "Aven Colony", "It's huge"],
      [5, "Not A Puzzle", "Be warned"],
    ];

    let entities = [];
    for (const data of gameData) {
      let game = new Game();
      game.id = data[0] as any;
      game.title = data[1] as any;
      game.shortDesc = data[2] as any;
      entities.push(game);
    }
    await gameRepo.persist(entities);

    let allGames = await gameRepo.find();
    t.is(allGames.length, entities.length);

    let fetchedGame = await gameRepo.findOneById(1);
    t.ok(fetchedGame);

    t.same(fetchedGame.title, "Overland");
    t.same(fetchedGame.shortDesc, "Everything is on fire");

    const updateGame = new Game();
    updateGame.id = fetchedGame.id;
    updateGame.shortDesc = "Good luck";
    await gameRepo.persist(updateGame);

    fetchedGame = await gameRepo.findOneById(1);
    t.ok(fetchedGame);
    t.same(fetchedGame.title, "Overland", "title is still the same");
    t.same(fetchedGame.shortDesc, "Good luck");

    fetchedGame = await gameRepo.findOne({ title: "Puzzle Puppers" });
    t.ok(fetchedGame);
    t.same(fetchedGame.id, 2);

    const gameQuery = gameRepo
      .createQueryBuilder("g")
      .where("lower(g.title) LIKE lower(:query)");

    const searchGame = async (query: string) =>
      await gameQuery.setParameter("query", `%${query}%`).getOne();

    fetchedGame = await searchGame("puzzle");
    t.ok(fetchedGame);
    t.same(fetchedGame.id, 2);

    fetchedGame = await searchGame("COLONY");
    t.ok(fetchedGame);
    t.same(fetchedGame.id, 4);

    const puzzleGamesQuery = gameRepo
      .createQueryBuilder("g")
      .where(
        "lower(g.title) LIKE lower(:query) OR lower(g.shortDesc) LIKE lower(:query)",
      )
      .setParameter("query", "%puzzle%")
      .orderBy("g.id", "ASC");

    let puzzleGames = await puzzleGamesQuery
      .clone()
      .setOffset(0)
      .setLimit(1)
      .getMany();
    t.ok(puzzleGames);
    t.same(puzzleGames.length, 1, "fetches first page");

    puzzleGames = await puzzleGamesQuery
      .clone()
      .setOffset(1)
      .setLimit(1)
      .getMany();
    t.ok(puzzleGames);
    t.same(puzzleGames.length, 1, "fetches second page");

    puzzleGames = await puzzleGamesQuery
      .clone()
      .setOffset(2)
      .setLimit(1)
      .getMany();
    t.ok(puzzleGames);
    t.same(puzzleGames.length, 1, "fetches third page");

    puzzleGames = await puzzleGamesQuery
      .clone()
      .setOffset(3)
      .setLimit(1)
      .getMany();
    t.ok(puzzleGames);
    t.same(puzzleGames.length, 0, "fourth page is empty");

    let puzzleGamesCount;
    [puzzleGames, puzzleGamesCount] = await puzzleGamesQuery
      .clone()
      .setLimit(2)
      .getManyAndCount();
    t.ok(puzzleGames);
    t.same(puzzleGames.length, 2, "finds two games");
    t.same(puzzleGamesCount, 3, "counts three games");

    let specificGames = await gameRepo
      .createQueryBuilder("g")
      .where("g.id in (:ids)", { ids: [2, 4, 6] })
      .getMany();
    t.ok(specificGames);
    t.same(specificGames.length, 2, "found both games by id");
    t.ok(_.find(specificGames, { id: 2 }));
    t.ok(_.find(specificGames, { id: 4 }));
    t.notOk(_.find(specificGames, { id: 6 }));

    {
      const game1 = await gameRepo.findOneById(1);
      const game2 = await gameRepo.findOneById(1);
      t.is(typeof game1, "object");
      t.false(game1 === game2);
      t.true(deepEquals(game1, game2));
      game1.title = "Something else now!";
      t.false(deepEquals(game1, game2));

      const game3 = gameRepo.merge(game2);
      t.is(typeof game3, "object");
      t.false(game2 === game3);
      t.true(deepEquals(game2, game3));
      await gameRepo.persist(game3);

      const game4 = {
        ...game3,
        title: "Yeah",
      };
      t.false(deepEquals(game3, game4));
      await gameRepo.persist(game4);
    }

    {
      const game1 = await gameRepo.findOneById(1);
      await gameRepo.remove({ id: 1 } as any);
      const game2 = await gameRepo.findOneById(1);
      t.ok(game1);
      t.notOk(game2);
    }
  });
});
