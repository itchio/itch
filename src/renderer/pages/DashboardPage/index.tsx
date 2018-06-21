import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { FetchProfileGamesResult } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { TabInstance, LocalizedString } from "common/types";
import { rendererWindow } from "common/util/navigation";
import React from "react";
import Filler from "renderer/basics/Filler";
import FiltersContainer from "renderer/basics/FiltersContainer";
import butlerCaller from "renderer/hocs/butlerCaller";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withProfileId } from "renderer/hocs/withProfileId";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import EmptyState from "renderer/basics/EmptyState";
import { isEmpty, debounce } from "underscore";
import { Box, BoxInner } from "renderer/pages/PageStyles/boxes";
import StandardGameDesc from "renderer/pages/common/StandardGameDesc";
import { StandardGameCover } from "renderer/pages/PageStyles/games";
import ProfileGameStats from "renderer/pages/DashboardPage/ProfileGameStats";
import ItemList from "renderer/pages/common/ItemList";
import Page from "renderer/pages/common/Page";
import {
  SortSpacer,
  SortsAndFilters,
  SortGroup,
  SortOption,
} from "renderer/pages/common/SortsAndFilters";
import FilterInput from "renderer/pages/common/FilterInput";
import DraftStatus from "renderer/pages/DashboardPage/DraftStatus";

const FetchProfileGames = butlerCaller(messages.FetchProfileGames);

class DashboardPage extends React.PureComponent<Props, State> {
  constructor(props: DashboardPage["props"], context: any) {
    super(props, context);
    this.state = {
      search: "",
    };
  }

  render() {
    const { profileId, tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);

    return (
      <Page>
        <FetchProfileGames
          params={{
            profileId,
            limit: 15,
            cursor: sp.queryParam("cursor"),
            sortBy: sp.queryParam("sortBy"),
            search: this.state.search,
            filters: {
              visibility: sp.queryParam("visibility"),
              paidStatus: sp.queryParam("paidStatus"),
            },
          }}
          sequence={this.props.sequence}
          onResult={result => {
            this.props.dispatch(
              actions.tabDataFetched({
                window: rendererWindow(),
                tab: this.props.tab,
                data: { label: ["sidebar.dashboard"] },
              })
            );
          }}
          loadingHandled
          render={({ result, loading }) => {
            return (
              <>
                <FiltersContainer loading={loading}>
                  {this.renderSearch(sp)}
                </FiltersContainer>
                <SortsAndFilters>
                  {this.renderSorts(sp)}
                  <SortSpacer />
                  {this.renderVisibilityFilter(sp)}
                  <SortSpacer />
                  {this.renderPaidStatusFilter(sp)}
                </SortsAndFilters>
                <ItemList>{this.renderItems(result)}</ItemList>
              </>
            );
          }}
        />
      </Page>
    );
  }

  renderItems(result: FetchProfileGamesResult) {
    if (!result) {
      return null;
    }
    const { items, nextCursor } = result;

    let nextPageURL = null;
    if (nextCursor) {
      const sp = Space.fromInstance(this.props.tabInstance);
      nextPageURL = sp.urlWithParams({
        cursor: nextCursor,
      });
    }

    if (isEmpty(items)) {
      return <EmptyState bigText="Nothing to see here!" icon="filter" />;
    }

    return (
      <>
        {items.map(item => {
          if (!item) {
            return null;
          }
          const { game } = item;

          return (
            <Box key={game.id}>
              <BoxInner>
                <StandardGameCover game={game} />
                <SortSpacer />
                <StandardGameDesc game={game}>
                  {item.published ? null : <DraftStatus>Draft</DraftStatus>}
                </StandardGameDesc>
                <Filler />
                <ProfileGameStats pg={item} />
              </BoxInner>
            </Box>
          );
        })}
        {nextCursor ? <a href={nextPageURL}>Next page</a> : null}
      </>
    );
  }

  renderPaidStatusFilter(sp: Space): JSX.Element {
    return (
      <SortGroup>
        {this.renderPaidStatus(sp, "", "All")}
        {this.renderPaidStatus(sp, "free", "Free")}
        {this.renderPaidStatus(sp, "paid", "Paid")}
      </SortGroup>
    );
  }

  renderPaidStatus(
    sp: Space,
    paidStatus: string,
    label: LocalizedString
  ): JSX.Element {
    return (
      <SortOption
        sp={sp}
        optionKey="paidStatus"
        optionValue={paidStatus}
        icon="coin"
        label={label}
      />
    );
  }

  renderVisibilityFilter(sp: Space): JSX.Element {
    return (
      <>
        <SortGroup>
          {this.renderVisibility(sp, "", "All")}
          {this.renderVisibility(sp, "published", "Published")}
          {this.renderVisibility(sp, "draft", "Draft")}
        </SortGroup>
      </>
    );
  }

  renderVisibility(
    sp: Space,
    visibility: string,
    label: LocalizedString
  ): JSX.Element {
    return (
      <SortOption
        sp={sp}
        optionKey="visibility"
        optionValue={visibility}
        icon="earth"
        label={label}
      />
    );
  }

  renderSorts(sp: Space): JSX.Element {
    return (
      <SortGroup>
        {this.renderSort(sp, "default", "Default")}
        {this.renderSort(sp, "views", "Most views")}
        {this.renderSort(sp, "downloads", "Most downloads")}
        {this.renderSort(sp, "purchases", "Most purchases")}
      </SortGroup>
    );
  }

  renderSort(sp: Space, sortBy: string, label: LocalizedString): JSX.Element {
    return (
      <SortOption
        sp={sp}
        optionKey="sortBy"
        optionValue={sortBy}
        icon="sort-alpha-asc"
        label={label}
      />
    );
  }

  renderSearch(sp: Space): JSX.Element {
    const debouncedSetSearch = debounce(this.setSearch, 250);
    return (
      <FilterInput
        placeholder="Filter..."
        onChange={e => debouncedSetSearch(e.currentTarget.value)}
      />
    );
  }

  setSearch = (search: string) => {
    this.setState({ search });
  };
}

interface Props extends MeatProps {
  tab: string;
  profileId: number;
  dispatch: Dispatch;
  tabInstance: TabInstance;
}

interface State {
  search: string;
}

export default withTab(
  withProfileId(withTabInstance(withDispatch(DashboardPage)))
);
