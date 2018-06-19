import React from "react";
import { ProfileGame } from "common/butlerd/messages";
import { StatBox, StatNumber } from "renderer/pages/PageStyles/stats";
import { FormattedNumber } from "react-intl";

//-----------------------------------
// Stats
//-----------------------------------

export default ({ pg }: { pg: ProfileGame }) => (
  <>
    <StatBox>
      <StatNumber>
        <FormattedNumber value={pg.viewsCount} />
      </StatNumber>{" "}
      views
    </StatBox>
    <StatBox>
      <StatNumber>
        <FormattedNumber value={pg.downloadsCount} />
      </StatNumber>{" "}
      downloads
    </StatBox>
    <StatBox>
      <StatNumber>
        <FormattedNumber value={pg.purchasesCount} />
      </StatNumber>{" "}
      purchases
    </StatBox>
  </>
);
