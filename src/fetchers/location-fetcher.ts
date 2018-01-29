import { Fetcher } from "./fetcher";

export default class LocationFetcher extends Fetcher {
  async work(): Promise<void> {
    const { db } = this.ctx;
    const id = this.space().stringId();

    let path = id === "appdata" ? "appdata" : null;
    if (!path) {
      const info = this.ctx.store.getState().preferences.installLocations[id];
      if (info) {
        path = info.path;
      }
    }

    if (!path) {
      path = "<unknown path>";
    }
    this.push({
      location: {
        path,
      },
    });

    const games = db.games.all(k =>
      k.where(
        "exists (select * from caves where caves.gameId = games.id and caves.installLocation = ?)",
        id
      )
    );

    this.pushUnfilteredGames(games);
  }
}
