import React from "react";
import { ProfileGame } from "common/butlerd/messages";
import { StatBox, StatNumber } from "renderer/pages/PageStyles/stats";
import { FormattedNumber } from "react-intl";
import { T } from "renderer/t";

//-----------------------------------
// Stats
//-----------------------------------

export default ({ pg }: { pg: ProfileGame }) => (
  <>
    <StatBox>
      <StatNumber>
        <FormattedNumber value={pg.viewsCount} />
      </StatNumber>{" "}
      {T(["dashboard.game_stats.views"])}
    </StatBox>
    <StatBox>
      <StatNumber>
        <FormattedNumber value={pg.downloadsCount} />
      </StatNumber>{" "}
      {T(["dashboard.game_stats.downloads"])}
    </StatBox>
    <StatBox>
      <StatNumber>
        <FormattedNumber value={pg.purchasesCount} />
      </StatNumber>{" "}
      {T(["dashboard.game_stats.purchases"])}
    </StatBox>
  </>
);
