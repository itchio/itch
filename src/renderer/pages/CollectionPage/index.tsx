import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { FetchCollectionGamesResult } from "common/butlerd/messages";
import urls from "common/constants/urls";
import { Space } from "common/helpers/space";
import { ITabInstance } from "common/types";
import { rendererWindow, urlForGame } from "common/util/navigation";
import React from "react";
import FiltersContainer from "renderer/basics/FiltersContainer";
import IconButton from "renderer/basics/IconButton";
import butlerCaller from "renderer/hocs/butlerCaller";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withProfileId } from "renderer/hocs/withProfileId";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { isEmpty } from "underscore";

const CollectionDiv = styled.div`
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

const FetchCollection = butlerCaller(messages.FetchCollection);
const FetchCollectionGames = butlerCaller(messages.FetchCollectionGames);

class CollectionPage extends React.PureComponent<Props> {
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
              <div className="list">{this.renderCollectionGames(result)}</div>
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
                <div className="item" key={cg.game.id}>
                  <a href={urlForGame(cg.game.id)}>
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

interface Props extends MeatProps {
  profileId: number;
  tabInstance: ITabInstance;
  tab: string;
  dispatch: Dispatch;
}

export default withProfileId(
  withTabInstance(withTab(withDispatch(CollectionPage)))
);
