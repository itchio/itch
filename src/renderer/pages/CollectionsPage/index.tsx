import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { FetchProfileCollectionsResult } from "common/butlerd/messages";
import urls from "common/constants/urls";
import { Space } from "common/helpers/space";
import { TabInstance } from "common/types";
import { rendererWindow, urlForCollection } from "common/util/navigation";
import React from "react";
import EmptyState from "renderer/basics/EmptyState";
import FiltersContainer from "renderer/basics/FiltersContainer";
import TimeAgo from "renderer/basics/TimeAgo";
import butlerCaller from "renderer/hocs/butlerCaller";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withProfileId } from "renderer/hocs/withProfileId";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { isEmpty } from "underscore";
import GameStripe from "renderer/pages/common/GameStripe";
import ItemList from "renderer/pages/common/ItemList";
import Icon from "renderer/basics/Icon";
import Filler from "renderer/basics/Filler";

const FetchProfileCollections = butlerCaller(messages.FetchProfileCollections);
const CollectionGameStripe = GameStripe(messages.FetchCollectionGames);

const CollectionsDiv = styled.div`
  ${styles.meat()};
`;

const CollectionInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  font-size: 80%;
  font-weight: 400;
  margin: 0 1em;
`;

const CollectionInfoSpacer = styled.div`
  width: 0.4em;
`;

class CollectionsPage extends React.PureComponent<Props> {
  render() {
    const { profileId, tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);

    return (
      <CollectionsDiv>
        <FetchProfileCollections
          params={{ profileId, limit: 15, cursor: sp.queryParam("cursor") }}
          sequence={this.props.sequence}
          onResult={() => {
            this.props.dispatch(
              actions.tabDataFetched({
                window: rendererWindow(),
                tab: this.props.tab,
                data: { label: ["sidebar.collections"] },
              })
            );
          }}
          loadingHandled
          render={({ result, loading }) => {
            return (
              <>
                <FiltersContainer loading={loading}>
                  <a href={urls.myCollections}>
                    {T(["outlinks.manage_collections"])}
                  </a>
                </FiltersContainer>
                <ItemList>{this.renderCollections(result)}</ItemList>
              </>
            );
          }}
        />
      </CollectionsDiv>
    );
  }

  renderCollections(result: FetchProfileCollectionsResult) {
    if (!result) {
      return null;
    }
    const { items, nextCursor } = result;
    const { profileId } = this.props;

    if (isEmpty(items)) {
      return (
        <EmptyState
          icon="tag"
          bigText={["collections.empty"]}
          smallText={["collections.empty_sub"]}
          buttonIcon="earth"
          buttonText={["status.downloads.find_games_button"]}
          buttonAction={() =>
            this.props.dispatch(
              actions.navigate({
                window: "root",
                url: "itch://featured",
              })
            )
          }
        />
      );
    }

    let nextPageURL = null;
    if (nextCursor) {
      const sp = Space.fromInstance(this.props.tabInstance);
      nextPageURL = sp.urlWithParams({
        cursor: nextCursor,
      });
    }

    return (
      <>
        {items.map(coll => (
          // fixme sequence
          <>
            <CollectionGameStripe
              title={coll.title}
              href={urlForCollection(coll.id)}
              params={{ profileId, collectionId: coll.id }}
              sequence={0}
              renderTitleExtras={() => (
                <>
                  <Filler />
                  <CollectionInfo>
                    <Icon icon="tag" />
                    <CollectionInfoSpacer />
                    {coll.gamesCount} games
                  </CollectionInfo>
                  <CollectionInfo>
                    <Icon icon="history" />
                    <CollectionInfoSpacer />
                    Last updated
                    <CollectionInfoSpacer />
                    <TimeAgo date={coll.updatedAt} />
                  </CollectionInfo>
                </>
              )}
              map={result => {
                if (!result || isEmpty(result.items)) {
                  return [];
                }
                return result.items.map(cg => cg.game);
              }}
            />
          </>
        ))}
        {nextCursor ? <a href={nextPageURL}>Next page</a> : null}
      </>
    );
  }
}

interface Props extends MeatProps {
  tab: string;
  profileId: number;
  dispatch: Dispatch;
  tabInstance: TabInstance;
}

export default withTab(
  withProfileId(withTabInstance(withDispatch(CollectionsPage)))
);
