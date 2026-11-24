import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import urls from "common/constants/urls";
import { classificationFromQuery } from "common/helpers/classification-from-query";
import { ambientTab } from "common/util/navigation";
import React, { useEffect } from "react";
import ErrorState from "renderer/basics/ErrorState";
import MoreMenuButton from "renderer/pages/common/MoreMenuButton";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { useAppDispatch, useAppSelector } from "renderer/hooks/redux";
import { useButlerd } from "renderer/hooks/useButlerd";
import { useProfile } from "renderer/hooks/useProfile";
import { useTab } from "renderer/hooks/useTab";
import {
  FilterGroupGameClassification,
  FilterGroupPlatform,
} from "renderer/pages/common/CommonFilters";
import { FilterOption } from "renderer/pages/common/Filter";
import SearchControl from "renderer/pages/common/SearchControl";
import { SortOption } from "renderer/pages/common/Sort";
import {
  FilterGroup,
  FilterSpacer,
  SortsAndFilters,
} from "renderer/pages/common/SortsAndFilters";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import makeGameSeries from "renderer/series/GameSeries";
import { _ } from "renderer/t";

const BundleGameSeries = makeGameSeries(messages.FetchBundleGames);

const getRecord = BundleGameSeries.getRecordCallback((bg) => bg.game);
const renderItemExtras = BundleGameSeries.renderItemExtrasCallback((bg) => (
  <StandardMainAction game={bg.game} forceOwned />
));

const renderExtraFilters = () => (
  <SortsAndFilters>
    <FilterGroup>
      <SortOption sortBy="title" label={_("sort_by.games.title")} />
    </FilterGroup>
    <FilterSpacer />
    <FilterGroup>
      <FilterOption
        optionKey="installed"
        optionValue="true"
        label={_("filter_by.games.status.installed")}
      />
    </FilterGroup>
    <FilterSpacer />
    <FilterGroupPlatform />
    <FilterSpacer />
    <FilterGroupGameClassification />
  </SortsAndFilters>
);

const Bundle = ({ bundleId }: { bundleId: number }) => {
  const tab = useTab();
  const dispatch = useAppDispatch();
  const profile = useProfile();
  const query = useAppSelector((rs) => ambientTab(rs, { tab }).location?.query);

  const { error, result } = useButlerd(messages.FetchProfileOwnedBundles, {
    profileId: profile.id,
    limit: 100,
  });

  // an effect rather than onResult, the tab can move to another bundle
  // without the list being fetched again
  useEffect(() => {
    if (!result) {
      return;
    }
    let label = "Bundle not found";
    const bundle = (result.items ?? []).find(
      (item) => item.bundleId === bundleId
    )?.bundle;
    if (bundle) {
      label = `${bundle.title} (${bundle.gamesCount})`;
    }
    dispatchTabPageUpdate({ tab, dispatch }, { label });
  }, [result, bundleId]);

  const renderMainFilters = () => {
    // we don't know the slug, the website will redirect to the proper one
    const url = `${urls.itchio}/b/${bundleId}/hello`;
    return (
      <>
        <SearchControl />
        <MoreMenuButton
          template={[
            {
              localizedLabel: ["browser.popout"],
              action: actions.openInExternalBrowser({ url }),
            },
          ]}
        />
      </>
    );
  };

  return (
    <>
      {error ? <ErrorState error={error} /> : null}

      <BundleGameSeries
        label={undefined}
        forceOwned
        params={{
          profileId: profile.id,
          bundleId,
          sortBy: query?.sortBy,
          reverse: query?.sortDir === "reverse",
          search: query?.search,
          filters: {
            classification: classificationFromQuery(query?.classification),
            installed: query?.installed === "true",
            platform: query?.platform,
          },
        }}
        getRecord={getRecord}
        renderItemExtras={renderItemExtras}
        renderMainFilters={renderMainFilters}
        renderExtraFilters={renderExtraFilters}
      />
    </>
  );
};

const BundlePage = (_props: MeatProps) => {
  const tab = useTab();
  const rawBundleId = useAppSelector(
    (rs) => ambientTab(rs, { tab }).location?.secondPathElement
  );

  const bundleId = rawBundleId ? parseInt(rawBundleId, 10) : NaN;
  if (Number.isNaN(bundleId)) {
    // the tab has no parsed location (yet)
    return null;
  }
  return <Bundle bundleId={bundleId} />;
};

export default BundlePage;
