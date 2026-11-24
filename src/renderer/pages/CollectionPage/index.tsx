import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import urls from "common/constants/urls";
import { classificationFromQuery } from "common/helpers/classification-from-query";
import { MenuTemplate } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
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
import modals from "renderer/modals";

const CollectionGameSeries = makeGameSeries(messages.FetchCollectionGames);

const getRecord = CollectionGameSeries.getRecordCallback((cg) => cg.game);
const renderItemExtras = CollectionGameSeries.renderItemExtrasCallback((cg) => (
  <StandardMainAction game={cg.game} />
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

const CollectionContents = ({ collectionId }: { collectionId: number }) => {
  const tab = useTab();
  const dispatch = useAppDispatch();
  const profile = useProfile();
  const query = useAppSelector((rs) => ambientTab(rs, { tab }).location?.query);

  const { error, result } = useButlerd(
    messages.FetchCollection,
    { profileId: profile.id, collectionId },
    {
      onResult: ({ collection }) => {
        let label = "Collection not found";
        if (collection) {
          label = `${collection.title} (${collection.gamesCount})`;
        }
        dispatchTabPageUpdate({ tab, dispatch }, { label });
      },
    }
  );
  const collection = result?.collection;

  const renderMainFilters = () => {
    // we don't know the slug, the website will redirect to the proper one
    const url = `${urls.itchio}/c/${collectionId}/hello`;
    const template: MenuTemplate = [
      {
        localizedLabel: ["browser.popout"],
        action: actions.openInExternalBrowser({ url }),
      },
    ];
    if (
      collection &&
      // the result of the previous collection sticks around while loading
      collection.id === collectionId &&
      collection.userId === profile.user.id
    ) {
      template.push(
        { type: "separator" },
        {
          localizedLabel: ["collection.menu.edit"],
          action: actions.openModal(
            modals.editCollection.make({
              wind: "root",
              title: ["collection.edit.title"],
              message: "",
              widgetParams: { collection, tab },
            })
          ),
        },
        {
          localizedLabel: ["collection.menu.order"],
          enabled: collection.gamesCount > 1,
          action: actions.openModal(
            modals.orderCollectionGames.make({
              wind: "root",
              title: ["collection.order.title"],
              message: "",
              widgetParams: { collection },
            })
          ),
        },
        {
          localizedLabel: ["collection.menu.delete"],
          action: actions.requestCollectionDelete({
            collectionId: collection.id,
            tab,
          }),
        }
      );
    }
    return (
      <>
        <SearchControl />
        <MoreMenuButton template={template} />
      </>
    );
  };

  return (
    <>
      {error ? <ErrorState error={error} /> : null}

      <CollectionGameSeries
        params={{
          profileId: profile.id,
          collectionId,
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

const CollectionPage = (_props: MeatProps) => {
  const tab = useTab();
  const collectionId = useAppSelector((rs) => {
    const id = ambientTab(rs, { tab }).location?.firstPathNumber;
    // NaN never equals itself, so it would rerender on every store update
    return Number.isNaN(id) ? undefined : id;
  });

  if (collectionId === undefined) {
    // the tab has no parsed location (yet)
    return null;
  }
  return <CollectionContents collectionId={collectionId} />;
};

export default CollectionPage;
