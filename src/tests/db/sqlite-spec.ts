
// tslint:disable:no-shadowed-variable

import {createConnection, Entity, Column, PrimaryColumn} from "typeorm";
import test = require("zopf");

@Entity()
class Game {
  @PrimaryColumn("int")
  id: number;

  @Column("string", {length: 500})
  title: string;

  @Column("text")
  shortDesc: string;
}

test("sqlite", t => {
  t.case("run a few queries", async t => {
    const conn = await createConnection({
      driver: {
        type: "sqlite",
        storage: ":memory:",
      },
      entities: [Game],
      autoSchemaSync: true,
    });

    const gameRepo = conn.getRepository(Game);

    let gameData = [
      [1, "Overland", "Everything is on fire"],
      [2, "Puzzle Puppers", "Drag out doggos!"],
      [3, "Thorny Weather", "Underrated puzzle game"],
      [4, "Aven Colony", "It's huge"],
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

    fetchedGame = await gameRepo.findOne({title: "Puzzle Puppers"});
    t.ok(fetchedGame);
    t.same(fetchedGame.id, 2);

    const searchGame = async (query: string) => await gameRepo.createQueryBuilder("g")
      .where("lower(g.title) LIKE lower(:query)", {query: `%${query}%`})
      .getOne();

    fetchedGame = await searchGame("puzzle");
    t.ok(fetchedGame);
    t.same(fetchedGame.id, 2);

    fetchedGame = await searchGame("COLONY");
    t.ok(fetchedGame);
    t.same(fetchedGame.id, 4);
  });
});

