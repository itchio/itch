import { GameModel, IOwnGame } from "./models/game";
import { UserModel, IOwnUser } from "./models/user";
import { CollectionModel, ICollection } from "./models/collection";
import { CaveModel, ICave } from "./models/cave";
import { DownloadKeyModel, IDownloadKey } from "./models/download-key";
import { GamePasswordModel, IGamePassword } from "./models/game-password";
import { GameSecretModel, IGameSecret } from "./models/game-secret";
import { ExternalGameModel, IExternalGame } from "./models/external-game";
import { ProfileModel, IProfile } from "./models/profile";

import { IMigrations } from "./migrator";

// stolen from lapis, yay
export default <IMigrations>{
  1498742676: m => {
    m.createTable<IOwnGame>(GameModel, t => {
      t.integer("id").primary();

      t.text("url");
      t.integer("userId");
      t.text("title");

      t.text("shortText");
      t.text("stillCoverUrl");
      t.text("coverUrl");
      t.text("type");
      t.text("classification");
      t.json("embed");

      t.boolean("hasDemo");
      t.integer("minPrice");
      t.json("sale");
      t.text("currency");
      t.boolean("inPressSystem");
      t.boolean("canBeBought");

      t.dateTime("createdAt");
      t.dateTime("publishedAt");

      t.boolean("pOsx");
      t.boolean("pWindows");
      t.boolean("pLinux");
      t.boolean("pAndroid");

      t.integer("downloadsCount");
      t.integer("purchasesCount");
      t.integer("viewsCount");
    });

    m.createTable<IOwnUser>(UserModel, t => {
      t.integer("id").primary();
      t.text("username");
      t.text("displayName");
      t.text("url");
      t.text("coverUrl");
      t.text("stillCoverUrl");

      t.boolean("developer");
      t.boolean("pressUser");
    });

    m.createTable<ICollection>(CollectionModel, t => {
      t.integer("id").primary();
      t.text("title");
      t.integer("userId");

      t.dateTime("createdAt");
      t.dateTime("updatedAt");

      t.integer("gamesCount");
      t.json("gameIds");
    });

    m.createTable<ICave>(CaveModel, t => {
      t.text("id").primary();
      t.integer("gameId");
      t.integer("externalGameId");

      t.json("upload");
      t.integer("buildId");
      t.text("buildUserVersion");
      t.text("channelName");

      t.dateTime("installedAt");
      t.dateTime("lastTouchedAt");

      t.integer("secondsRun");
      t.boolean("handPicked");
      t.integer("installedSize");
      t.boolean("installedUE4Prereq");
      t.json("installedPrereqs");

      t.text("installLocation");
      t.text("installFolder");
      t.integer("pathScheme");

      t.json("verdict");
    });

    m.createTable<IDownloadKey>(DownloadKeyModel, t => {
      t.integer("id").primary();

      t.integer("gameId");
      t.dateTime("createdAt");
      t.dateTime("updatedAt");
      t.integer("ownerId");
    });

    m.createTable<IGamePassword>(GamePasswordModel, t => {
      t.integer("id").primary();
      t.text("password");
    });

    m.createTable<IGameSecret>(GameSecretModel, t => {
      t.integer("id").primary();
      t.text("secret");
    });

    m.createTable<IExternalGame>(ExternalGameModel, t => {
      t.text("id").primary();

      t.text("title");
      t.text("shortText");
      t.text("coverUrl");
    });

    m.createTable<IProfile>(ProfileModel, t => {
      t.integer("id").primary();

      t.json("myGameIds");
    });
  },
};
