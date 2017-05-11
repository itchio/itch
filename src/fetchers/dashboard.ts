
import {Fetcher, Outcome} from "./types";
import Game from "../models/game";

export default class DashboardFetcher extends Fetcher {
  constructor () {
    super();
  }

  async work(): Promise<Outcome> {
    const {market} = this.getMarkets();
    if (!market) {
      this.debug(`No user market :(`);
      return this.retry();
    }

    let meId: number;
    try {
      meId = this.store.getState().session.credentials.me.id;
    } catch (e) {
      this.debug(`Couldn't get meId, not logged in maybe? ${e}`);
      return this.retry();
    }

    const gameRepo = market.getRepo(Game);
    const games = await gameRepo.find({userId: meId});
    this.push({games});
  }
}
