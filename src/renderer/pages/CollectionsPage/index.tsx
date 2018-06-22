import { actions } from "common/actions";
import { messages } from "common/butlerd";
import {
  FetchProfileCollectionsResult,
  Profile,
} from "common/butlerd/messages";
import urls from "common/constants/urls";
import { Space } from "common/helpers/space";
import { urlForCollection } from "common/util/navigation";
import React from "react";
import EmptyState from "renderer/basics/EmptyState";
import ErrorState from "renderer/basics/ErrorState";
import FiltersContainer from "renderer/basics/FiltersContainer";
import TimeAgo from "renderer/basics/TimeAgo";
import butlerCaller from "renderer/hocs/butlerCaller";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withProfile } from "renderer/hocs/withProfile";
import { withSpace } from "renderer/hocs/withSpace";
import GameStripe from "renderer/pages/common/GameStripe";
import ItemList from "renderer/pages/common/ItemList";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { isEmpty } from "underscore";

const FetchProfileCollections = butlerCaller(messages.FetchProfileCollections);
const CollectionGameStripe = GameStripe(messages.FetchCollectionGames);

const CollectionsDiv = styled.div`
  ${styles.meat()};
`;

const CollectionInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  font-size: ${props => props.theme.fontSizes.baseText};
  color: ${props => props.theme.ternaryText};
  font-weight: 700;
  margin: 0 0.5em;
`;

const CollectionInfoSpacer = styled.div`
  width: 0.4em;
`;

class CollectionsPage extends React.PureComponent<Props> {
  render() {
    const { profile, space, dispatch } = this.props;

    return (
      <CollectionsDiv>
        <FetchProfileCollections
          params={{
            profileId: profile.id,
            limit: 6,
            cursor: space.queryParam("cursor"),
          }}
          sequence={this.props.sequence}
          onResult={() => {
            dispatch(space.makeFetch({ label: ["sidebar.collections"] }));
          }}
          loadingHandled
          errorsHandled
          render={({ result, error, loading }) => {
            return (
              <>
                <FiltersContainer loading={loading}>
                  <a href={urls.myCollections}>
                    {T(["outlinks.manage_collections"])}
                  </a>
                </FiltersContainer>
                <ErrorState error={error} />
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
    const { profile } = this.props;

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
      const { space } = this.props;
      nextPageURL = space.urlWithParams({
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
              params={{ profileId: profile.id, collectionId: coll.id }}
              sequence={0}
              renderTitleExtras={() => (
                <>
                  <CollectionInfoSpacer />
                  <CollectionInfo>{coll.gamesCount} games</CollectionInfo>
                  <CollectionInfo>
                    Updated
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
  space: Space;
  profile: Profile;
  dispatch: Dispatch;
}

export default withSpace(withProfile(withDispatch(CollectionsPage)));
