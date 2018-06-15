import React from "react";

import { MeatProps } from "renderer/components/meats/types";

import styled, * as styles from "./styles";
import { rendererWindow } from "common/util/navigation";
import ButlerCall from "./butler-call/butler-call";
import { messages } from "common/butlerd";
import { Dispatch, withDispatch } from "./dispatch-provider";
import { ITabInstance } from "common/types";
import { withTab } from "./meats/tab-provider";
import { withProfileId } from "./profile-provider";
import { withTabInstance } from "./meats/tab-instance-provider";
import { actions } from "common/actions";
import FiltersContainer from "./filters-container";
import { FetchProfileGamesResult } from "common/butlerd/messages";
import { Space } from "common/helpers/space";

const FetchProfileGames = ButlerCall(messages.FetchProfileGames);

const DashboardContainer = styled.div`
  ${styles.meat()};

  .list {
    overflow-y: auto;
  }

  .item {
    margin: 8px;
    line-height: 1.6;

    font-size: 120%;
  }
`;

class Dashboard extends React.PureComponent<Props> {
  render() {
    const { profileId, tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);

    return (
      <DashboardContainer>
        <FetchProfileGames
          params={{ profileId, limit: 15, cursor: sp.queryParam("cursor") }}
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
                <FiltersContainer loading={loading} />
                <div className="list">{this.renderProfileGames(result)}</div>
              </>
            );
          }}
        />
      </DashboardContainer>
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

    return (
      <>
        {items.map(pg => {
          if (!pg) {
            return null;
          }

          return (
            <div className="item" key={pg.game.id}>
              <a href={`itch://games/${pg.game.id}`}>
                <h3>{pg.game.title}</h3>
              </a>
              <p>{pg.game.shortText}</p>
            </div>
          );
        })}
        {nextCursor ? <a href={nextPageURL}>Next page</a> : null}
      </>
    );
  }
}

interface Props extends MeatProps {
  tab: string;
  profileId: number;
  dispatch: Dispatch;
  tabInstance: ITabInstance;
}

export default withTab(withProfileId(withTabInstance(withDispatch(Dashboard))));
