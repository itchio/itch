import * as messages from "common/butlerd/messages";
import { GameClassification } from "common/butlerd/messages";
import { classificationFromQuery } from "common/helpers/classification-from-query";
import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import { hookWithProps } from "renderer/hocs/hook";
import { withTab } from "renderer/hocs/withTab";
import {
  FilterGroupGameClassification,
  FilterGroupNeverPlayed,
} from "renderer/pages/common/CommonFilters";
import SearchControl from "renderer/pages/common/SearchControl";
import { SortOption } from "renderer/pages/common/Sort";
import {
  FilterGroup,
  FilterOptionIcon,
  FilterOptionLink,
  FilterSpacer,
  SortsAndFilters,
} from "renderer/pages/common/SortsAndFilters";
import CaveDescExtras from "renderer/pages/common/CaveDescExtras";
import CaveItemActions from "renderer/pages/common/CaveItemActions";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import makeGameSeries from "renderer/series/GameSeries";
import { T, _ } from "renderer/t";

const CaveGameSeries = makeGameSeries(messages.FetchCaves);

class InstalledPage extends React.PureComponent<Props> {
  override render() {
    const { search, sortBy, sortDir, classification, neverPlayed, profileId } =
      this.props;

    return (
      <CaveGameSeries
        label={_("sidebar.installed")}
        params={{
          sortBy,
          reverse: sortDir === "reverse",
          filters: { classification, neverPlayed: neverPlayed === "true" },
          search,
          profileId,
        }}
        getRecord={this.getRecord}
        getKey={this.getKey}
        hideGameDetails
        renderDescExtras={this.renderDescExtras}
        renderItemExtras={this.renderItemExtras}
        renderMainFilters={this.renderMainFilters}
        renderExtraFilters={this.renderExtraFilters}
      />
    );
  }

  getRecord = CaveGameSeries.getRecordCallback((cave) => cave.game);
  getKey = CaveGameSeries.getKeyCallback((cave) => cave.id);
  renderDescExtras = CaveGameSeries.renderItemExtrasCallback((cave) => (
    <CaveDescExtras cave={cave} />
  ));
  renderItemExtras = CaveGameSeries.renderItemExtrasCallback((cave) => (
    <CaveItemActions cave={cave} />
  ));
  renderMainFilters = () => <SearchControl />;
  renderExtraFilters = () => (
    <SortsAndFilters>
      <FilterGroup>
        <SortOption sortBy="title" label={_("sort_by.games.title")} />
        <SortOption
          sortBy="lastTouched"
          label={_("sort_by.games.last_touched")}
        />
        <SortOption sortBy="playTime" label={_("sort_by.games.play_time")} />
        <SortOption
          sortBy="installedSize"
          label={_("sort_by.games.size_on_disk")}
        />
        <SortOption
          sortBy="installedAt"
          label={_("sort_by.games.install_date")}
        />
      </FilterGroup>
      <FilterSpacer />
      <FilterGroupGameClassification />
      <FilterSpacer />
      <FilterGroupNeverPlayed />
      <FilterSpacer />
      <FilterGroup>
        <FilterOptionLink id="manage-install-locations" href="itch://locations">
          <FilterOptionIcon icon="cog" />
          {T(["install_locations.manage"])}
        </FilterOptionLink>
      </FilterGroup>
    </SortsAndFilters>
  );
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;

  sortBy: string | undefined;
  sortDir: string | undefined;
  search: string | undefined;
  classification: GameClassification | undefined;
  neverPlayed: string | undefined;
  profileId: number | undefined;
}

export default withTab(
  hookWithProps(InstalledPage)((map) => ({
    sortBy: map((rs, props) => ambientTab(rs, props).location?.query.sortBy),
    sortDir: map((rs, props) => ambientTab(rs, props).location?.query.sortDir),
    search: map((rs, props) => ambientTab(rs, props).location?.query.search),
    classification: map((rs, props) =>
      classificationFromQuery(
        ambientTab(rs, props).location?.query.classification
      )
    ),
    neverPlayed: map(
      (rs, props) => ambientTab(rs, props).location?.query.neverPlayed
    ),
    profileId: map((rs) => rs.profile.profile?.id),
  }))(InstalledPage)
);
