import classNames from "classnames";
import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { FetchProfileGamesResult } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { TabInstance, LocalizedString } from "common/types";
import { rendererWindow, urlForGame } from "common/util/navigation";
import React from "react";
import Filler from "renderer/basics/Filler";
import FiltersContainer, {
  FiltersContainerDiv,
} from "renderer/basics/FiltersContainer";
import butlerCaller from "renderer/hocs/butlerCaller";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withProfileId } from "renderer/hocs/withProfileId";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { GameCover } from "renderer/basics/Cover";
import { FormattedNumber } from "react-intl";
import Icon from "renderer/basics/Icon";
import EmptyState from "renderer/basics/EmptyState";
import { isEmpty, debounce } from "underscore";

const FetchProfileGames = butlerCaller(messages.FetchProfileGames);

const DraftStatus = styled.div`
  font-weight: normal;
  text-transform: lowercase;
  font-size: ${props => props.theme.fontSizes.baseText};
  color: ${props => props.theme.bundle};
  margin-left: 1em;
`;

const CoverBox = styled.div`
  flex-shrink: 0;
  width: 130px;
  margin-right: 14px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
`;

const TitleBox = styled.div`
  padding: 8px 0;
  align-self: flex-start;
`;

const StatGroup = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const StatBox = styled.div`
  padding: 0 4px;
  margin: 4px;
  margin-right: 16px;
  font-size: ${props => props.theme.fontSizes.baseText};
  color: ${props => props.theme.secondaryText};
  line-height: 1.4;
  font-weight: lighter;
`;

const StatNumber = styled.div`
  font-size: ${props => props.theme.fontSizes.larger};
  color: ${props => props.theme.baseText};
  min-width: 3em;
`;

const Title = styled.div`
  font-size: ${props => props.theme.fontSizes.huge};
  font-weight: lighter;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const inactiveBg = `linear-gradient(to top,hsla(355, 43%, 25%, 1),hsla(355, 43%, 17%, 1))`;
const activeBg = `linear-gradient(to top, hsla(355, 43%, 50%, 1), hsla(355, 43%, 37%, 1));`;
const borderColor = `#843442`;
const borderRadius = `4px`;

const DashboardDiv = styled.div`
  ${styles.meat()};

  .list {
    overflow-y: auto;
    padding: 0 12px;
  }

  .item {
    ${styles.boxy()};
    max-width: 1200px;

    margin: 1em auto;
    line-height: 1.6;
  }

  .sorts-and-filters {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    height: auto;

    padding: 0.4em 0.6em;
    font-weight: normal;

    .icon {
      margin-right: 0.5em;
      font-size: 80%;
    }

    .spacer {
      width: 24px;
    }
  }

  .sort-group {
    margin: 0.5em 0;
  }

  a.sort {
    display: inline-block;
    background: ${inactiveBg};
    padding: 0.5em 1em;
    margin: 0;
    border: 1px solid ${borderColor};
    border-left: none;

    &:first-child {
      border-radius: ${borderRadius} 0 0 ${borderRadius};
      border-left: 1px solid ${borderColor};
    }

    &:last-child {
      border-radius: 0 ${borderRadius} ${borderRadius} 0;
    }

    &.active {
      background: ${activeBg};
      color: ${props => props.theme.baseText};
    }
  }

  input[type="search"] {
    ${styles.searchInput()};
    min-width: 25em;
    padding-left: 10px;
    margin-left: 1.4em;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.3);
  }
`;

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
      <DashboardDiv>
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
                <FiltersContainer loading={loading} hideAddressBar>
                  {this.renderSearch(sp)}
                </FiltersContainer>
                <FiltersContainerDiv className="sorts-and-filters">
                  {this.renderSorts(sp)}
                  <div className="spacer" />
                  {this.renderVisibilityFilter(sp)}
                  <div className="spacer" />
                  {this.renderPaidStatusFilter(sp)}
                </FiltersContainerDiv>
                <div className="list">{this.renderProfileGames(result)}</div>
              </>
            );
          }}
        />
      </DashboardDiv>
    );
  }

  renderProfileGames(result: FetchProfileGamesResult) {
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
        {items.map(pg => {
          if (!pg) {
            return null;
          }

          return (
            <div className="item" key={pg.game.id}>
              <StatGroup>
                <CoverBox>
                  <a href={urlForGame(pg.game.id)}>
                    <GameCover game={pg.game} />
                  </a>
                </CoverBox>
                <TitleBox>
                  <a href={urlForGame(pg.game.id)}>
                    <Title>
                      {pg.game.title}
                      <Filler />
                      {pg.published ? null : <DraftStatus>Draft</DraftStatus>}
                    </Title>
                  </a>
                  <p>{pg.game.shortText}</p>
                </TitleBox>
                <Filler />
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
              </StatGroup>
            </div>
          );
        })}
        {nextCursor ? <a href={nextPageURL}>Next page</a> : null}
      </>
    );
  }

  renderPaidStatusFilter(sp: Space): JSX.Element {
    return (
      <>
        <div className="sort-group">
          {this.renderPaidStatus(sp, "", "All")}
          {this.renderPaidStatus(sp, "free", "Free")}
          {this.renderPaidStatus(sp, "paid", "Paid")}
        </div>
      </>
    );
  }

  renderPaidStatus(
    sp: Space,
    paidStatus: string,
    label: LocalizedString
  ): JSX.Element {
    return (
      <a
        className={classNames("sort", {
          active: isSortActive(paidStatus, sp.queryParam("paidStatus"), ""),
        })}
        href={sp.urlWithParams({
          paidStatus,
        })}
      >
        <Icon icon="coin" />
        {label}
      </a>
    );
  }

  renderVisibilityFilter(sp: Space): JSX.Element {
    return (
      <>
        <div className="sort-group">
          {this.renderVisibility(sp, "", "All")}
          {this.renderVisibility(sp, "published", "Published")}
          {this.renderVisibility(sp, "draft", "Draft")}
        </div>
      </>
    );
  }

  renderVisibility(
    sp: Space,
    visibility: string,
    label: LocalizedString
  ): JSX.Element {
    return (
      <a
        className={classNames("sort", {
          active: isSortActive(visibility, sp.queryParam("visibility"), ""),
        })}
        href={sp.urlWithParams({
          visibility,
        })}
      >
        <Icon icon="earth" />
        {label}
      </a>
    );
  }

  renderSorts(sp: Space): JSX.Element {
    return (
      <>
        <div className="sort-group">
          {this.renderSort(sp, "default", "Default")}
          {this.renderSort(sp, "views", "Most views")}
          {this.renderSort(sp, "downloads", "Most downloads")}
          {this.renderSort(sp, "purchases", "Most purchases")}
        </div>
      </>
    );
  }

  renderSort(sp: Space, sortBy: string, label: LocalizedString): JSX.Element {
    return (
      <a
        className={classNames("sort", {
          active: isSortActive(sortBy, sp.queryParam("sortBy"), "default"),
        })}
        href={sp.urlWithParams({
          sortBy,
        })}
      >
        <Icon icon="sort-alpha-asc" />
        {label}
      </a>
    );
  }

  renderSearch(sp: Space): JSX.Element {
    const debouncedSetSearch = debounce(this.setSearch, 250);
    return (
      <>
        <input
          type="search"
          placeholder="Filter..."
          onChange={e => debouncedSetSearch(e.currentTarget.value)}
        />
      </>
    );
  }

  setSearch = (search: string) => {
    this.setState({ search });
  };
}

function isSortActive(
  expected: string,
  actual: string,
  defaultSort: string
): boolean {
  if (!actual && expected === defaultSort) {
    return true;
  }
  return expected === actual;
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
