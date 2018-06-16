import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { FetchProfileCollectionsResult } from "common/butlerd/messages";
import urls from "common/constants/urls";
import { Space } from "common/helpers/space";
import { ITabInstance } from "common/types";
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

const FetchProfileCollections = butlerCaller(messages.FetchProfileCollections);

const CollectionsDiv = styled.div`
  ${styles.meat()};

  .collections-list {
    overflow-y: auto;
  }

  .collection {
    margin: 8px;
    padding: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    line-height: 1.6;
  }

  h2 {
    font-size: 140%;
  }

  .games-count {
    display: inline-block;
    min-width: 12em;
  }
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
          onResult={result => {
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
                <div className="collections-list">
                  {this.renderCollections(result)}
                </div>
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
          <div className="collection" key={coll.id}>
            <a href={urlForCollection(coll.id)}>
              <h2>{coll.title}</h2>
            </a>
            <p>
              <span className="games-count">
                <span className="icon icon-tag" /> {coll.gamesCount} games
              </span>{" "}
              <span className="icon icon-history" /> Last updated{" "}
              <TimeAgo date={coll.updatedAt} />
            </p>
          </div>
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
  tabInstance: ITabInstance;
}

export default withTab(
  withProfileId(withTabInstance(withDispatch(CollectionsPage)))
);
