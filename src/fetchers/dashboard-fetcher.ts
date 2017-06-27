import { Fetcher } from "./types";

import normalize from "../api/normalize";
import { game, arrayOf } from "../api/schemas";

import { addSortAndFilterToQuery } from "./sort-and-filter";

import { pluck, indexBy } from "underscore";

const emptyArr = [];

export default class DashboardFetcher extends Fetcher {
  async work(): Promise<void> {
    await this.pushLocal();

    if (this.warrantsRemote(this.reason)) {
      await this.remote();
      await this.pushLocal();
    }
  }

  async pushLocal() {
    const { db } = this.ctx;
    const meId = this.ensureCredentials().me.id;
    const profile = await db.profiles.findOneById(meId);
    if (!profile) {
      this.debug(`Could not find a profile for ${meId}`);
      return;
    }
    const myGameIds = profile.myGameIds || emptyArr;

    let query = db.games.createQueryBuilder("games");

    query.where("games.id in (:gameIds)");
    query.addParameters({ gameIds: myGameIds });
    const totalCount = myGameIds.length;

    addSortAndFilterToQuery(query, this.tabId, this.ctx.store);

    const [games, gamesCount] = await query.getManyAndCount();

    this.push({
      games: indexBy(games, "id"),
      gameIds: pluck(games, "id"),
      gamesCount,
      gamesOffset: 0,
      hiddenCount: totalCount - gamesCount,
    });
  }

  async remote() {
    const { db } = this.ctx;

    const apiResponse = await this.withApi(async api => {
      return await api.myGames();
    });

    const normalized = normalize(apiResponse, {
      games: arrayOf(game),
    });
    const meId = this.ensureCredentials().me.id;

    const remoteGameIds = pluck(normalized.entities.games, "id");
    this.debug(
      `Fetched ${Object.keys(normalized.entities.games).length} games from API`,
    );

    await db.saveMany({
      ...normalized.entities,
      profiles: {
        [meId]: {
          id: meId,
          myGameIds: remoteGameIds,
        },
      },
    });
  }
}
