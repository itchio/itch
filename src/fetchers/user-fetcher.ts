import { Fetcher } from "./fetcher";

import db from "../db";

import { userToTabData } from "../util/navigation";

export default class UserFetcher extends Fetcher {
  constructor() {
    super();
  }

  async work(): Promise<void> {
    const userId = this.space().numericId();

    let localUser = db.users.findOneById(userId);
    let pushUser = (user: typeof localUser) => {
      if (user) {
        this.push(userToTabData(user));
      }
    };
    pushUser(localUser);

    const userRes = await this.withApi(async api => await api.user(userId));
    pushUser(userRes.entities.users[userRes.result.userId]);
  }

  clean() {
    this.push(
      {
        users: null,
      },
      { shallow: true }
    );
  }
}
