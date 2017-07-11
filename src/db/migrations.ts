import { IMigrations } from "./migrator";

// stolen from lapis, yay
export default <IMigrations>{
  1498742676: async m => {
    // the DB schema is automatically synchronized, migrations
    // aren't useful for that
  },
};
