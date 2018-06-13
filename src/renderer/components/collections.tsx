import React from "react";

import urls from "common/constants/urls";

import FiltersContainer from "./filters-container";

import Filler from "./basics/filler";

import styled, * as styles from "./styles";
import { T } from "renderer/t";
import { MeatProps } from "./meats/types";
import { FetchProfileCollectionsResult } from "common/butlerd/messages";

import { isEmpty } from "underscore";
import { actions } from "common/actions";
import { withProfileId } from "./profile-provider";
import { Dispatch, withDispatch } from "./dispatch-provider";
import EmptyState from "./empty-state";
import ButlerCall from "./butler-call/butler-call";
import { messages } from "common/butlerd";
import { withTab } from "./meats/tab-provider";
import TimeAgo from "./basics/time-ago";
import { Space } from "common/helpers/space";
import { withTabInstance } from "./meats/tab-instance-provider";
import { ITabInstance } from "common/types";

const FetchProfileCollections = ButlerCall(messages.FetchProfileCollections);

const CollectionsContainer = styled.div`
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

class Collections extends React.PureComponent<Props> {
  render() {
    const { profileId, tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);

    return (
      <CollectionsContainer>
        <FetchProfileCollections
          params={{ profileId, limit: 15, cursor: sp.queryParam("cursor") }}
          sequence={this.props.sequence}
          loadingHandled
          render={({ result, loading }) => {
            return (
              <>
                <FiltersContainer loading={loading}>
                  <a href={urls.myCollections}>
                    {T(["outlinks.manage_collections"])}
                  </a>
                  <Filler />
                </FiltersContainer>
                <div className="collections-list">
                  {this.renderCollections(result)}
                </div>
              </>
            );
          }}
        />
      </CollectionsContainer>
    );
  }

  renderCollections(result: FetchProfileCollectionsResult) {
    if (!result) {
      return null;
    }
    const { collections, nextCursor } = result;

    if (isEmpty(collections)) {
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
        {collections.map(coll => (
          <div className="collection" key={coll.id}>
            <a href={`itch://collections/${coll.id}`}>
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
  withProfileId(withTabInstance(withDispatch(Collections)))
);
