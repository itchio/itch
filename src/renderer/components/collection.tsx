import React from "react";

import IconButton from "./basics/icon-button";

import styled, * as styles from "./styles";
import { isEmpty } from "underscore";

import { actions } from "common/actions";
import { Space } from "common/helpers/space";
import urls from "common/constants/urls";
import { MeatProps } from "renderer/components/meats/types";
import { ITabInstance } from "common/types";
import { withTabInstance } from "./meats/tab-instance-provider";
import { withDispatch, Dispatch } from "./dispatch-provider";
import ButlerCall from "./butler-call/butler-call";
import { messages } from "common/butlerd";
import { withProfileId } from "./profile-provider";
import FiltersContainer from "./filters-container";
import { FetchCollectionGamesResult } from "common/butlerd/messages";
import { withTab } from "./meats/tab-provider";
import { rendererWindow } from "common/util/navigation";

const CollectionDiv = styled.div`
  ${styles.meat()};

  .collection-games-list {
    overflow-y: auto;
  }

  .collection-game {
    margin: 8px;
    line-height: 1.6;

    font-size: 120%;
  }
`;

const FetchCollection = ButlerCall(messages.FetchCollection);
const FetchCollectionGames = ButlerCall(messages.FetchCollectionGames);

class Collection extends React.PureComponent<IProps> {
  render() {
    const { profileId, tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);
    const collectionId = sp.firstPathNumber();

    return (
      <CollectionDiv>
        <FetchCollection
          params={{
            profileId,
            collectionId,
          }}
          onResult={result => {
            if (!(result && result.collection)) {
              return;
            }
            const coll = result.collection;
            this.props.dispatch(
              actions.tabDataFetched({
                window: rendererWindow(),
                tab: this.props.tab,
                data: {
                  label: `${coll.title} (${coll.gamesCount})`,
                },
              })
            );
          }}
          loadingHandled
          render={({ result, loading }) => {
            return (
              <>
                <FiltersContainer loading={loading}>
                  <IconButton
                    icon="redo"
                    hint={["browser.popout"]}
                    hintPosition="bottom"
                    onClick={this.popOutBrowser}
                  />
                </FiltersContainer>
              </>
            );
          }}
        />
        <FetchCollectionGames
          params={{ profileId, collectionId, cursor: sp.queryParam("cursor") }}
          render={({ result }) => {
            return (
              <div className="collection-games-list">
                {this.renderCollectionGames(result)}
              </div>
            );
          }}
        />
      </CollectionDiv>
    );
  }

  renderCollectionGames(result: FetchCollectionGamesResult) {
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
        {isEmpty(items)
          ? null
          : items.map(cg => {
              return (
                <div className="collection-game" key={cg.game.id}>
                  <a href={`itch://games/${cg.game.id}`}>
                    <h3>{cg.game.title}</h3>
                  </a>
                  <p>{cg.game.shortText}</p>
                </div>
              );
            })}
        {nextCursor ? <a href={nextPageURL}>Next page</a> : null}
      </>
    );
  }

  popOutBrowser = () => {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);
    // we don't know the slug, the website will redirect to the proper one
    let url = `${urls.itchio}/c/${sp.firstPathNumber()}/hello`;
    this.props.dispatch(actions.openInExternalBrowser({ url }));
  };
}

interface IProps extends MeatProps {
  profileId: number;
  tabInstance: ITabInstance;
  tab: string;
  dispatch: Dispatch;
}

export default withProfileId(
  withTabInstance(withTab(withDispatch(Collection)))
);
