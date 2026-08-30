import { ProfileGame } from "common/butlerd/messages";
import { LocalizedString } from "common/types";
import { StatBox, StatNumber } from "renderer/pages/PageStyles/stats";
import { FormattedNumber, useIntl } from "react-intl";
import { T } from "renderer/t";

//-----------------------------------
// Stats
//-----------------------------------

const Stat = ({ value, label }: { value: number; label: LocalizedString }) => {
  const intl = useIntl();

  return (
    <StatBox>
      {/* compact keeps rows from going ragged once a game has millions of
          views; the hint carries the exact count */}
      <StatNumber data-rh={intl.formatNumber(value)} data-rh-at="top">
        <FormattedNumber value={value} notation="compact" />
      </StatNumber>
      {T(label)}
    </StatBox>
  );
};

export default ({ pg }: { pg: ProfileGame }) => (
  <>
    <Stat value={pg.viewsCount} label={["dashboard.game_stats.views"]} />
    <Stat
      value={pg.downloadsCount}
      label={["dashboard.game_stats.downloads"]}
    />
    <Stat
      value={pg.purchasesCount}
      label={["dashboard.game_stats.purchases"]}
    />
  </>
);
