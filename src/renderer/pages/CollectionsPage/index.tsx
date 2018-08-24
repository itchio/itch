import { actions } from "common/actions";
import { messages } from "common/butlerd";
import {
  FetchProfileCollectionsResult,
  Profile,
  Collection,
} from "common/butlerd/messages";
import urls from "common/constants/urls";
import { Dispatch } from "common/types";
import { ambientTab, urlForCollection } from "common/util/navigation";
import React from "react";
import EmptyState from "renderer/basics/EmptyState";
import ErrorState from "renderer/basics/ErrorState";
import FiltersContainer from "renderer/basics/FiltersContainer";
import TimeAgo from "renderer/basics/TimeAgo";
import butlerCaller from "renderer/hocs/butlerCaller";
import { hookWithProps } from "renderer/hocs/hook";
import { urlWithParams, dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withProfile } from "renderer/hocs/withProfile";
import { withTab } from "renderer/hocs/withTab";
import GameStripe from "renderer/pages/common/GameStripe";
import ItemList from "renderer/pages/common/ItemList";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { isEmpty } from "underscore";
import CollectionPreview from "renderer/pages/CollectionsPage/CollectionPreview";

const FetchProfileCollections = butlerCaller(messages.FetchProfileCollections);

const CollectionsDiv = styled.div`
  ${styles.meat};
`;

class CollectionsPage extends React.PureComponent<Props> {
  render() {
    const { profile, cursor, dispatch } = this.props;

    return (
      <CollectionsDiv>
        <FetchProfileCollections
          params={{
            profileId: profile.id,
            limit: 6,
            cursor,
          }}
          sequence={this.props.sequence}
          onResult={this.setLabel}
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

  setLabel = () => {
    dispatchTabPageUpdate(this.props, { label: ["sidebar.collections"] });
  };

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
          buttonAction={this.visitFeatured}
        />
      );
    }

    let nextPageURL = null;
    if (nextCursor) {
      const { url } = this.props;
      nextPageURL = urlWithParams(url, {
        cursor: nextCursor,
      });
    }

    return (
      <>
        {items.map(coll => (
          <CollectionPreview key={coll.id} coll={coll} profileId={profile.id} />
        ))}
        {nextCursor ? <a href={nextPageURL}>Next page</a> : null}
      </>
    );
  }

  visitFeatured = () => {
    this.props.dispatch(
      actions.navigate({
        wind: "root",
        url: "itch://featured",
      })
    );
  };
}

interface Props extends MeatProps {
  tab: string;
  profile: Profile;
  dispatch: Dispatch;

  url: string;
  cursor: string;
}

const hooked = hookWithProps(CollectionsPage)(map => ({
  url: map((rs, props) => ambientTab(rs, props).location.url),
  cursor: map((rs, props) => ambientTab(rs, props).location.query.cursor),
}))(CollectionsPage);
export default withTab(withProfile(hooked));
