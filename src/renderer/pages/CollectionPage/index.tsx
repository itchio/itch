import { actions } from "common/actions";
import { messages } from "common/butlerd";
import urls from "common/constants/urls";
import { Space } from "common/helpers/space";
import { TabInstance } from "common/types";
import React from "react";
import IconButton from "renderer/basics/IconButton";
import butlerCaller from "renderer/hocs/butlerCaller";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withProfileId } from "renderer/hocs/withProfileId";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import GameSeries from "renderer/pages/common/GameSeries";
import EmptyState from "renderer/basics/EmptyState";
import StandardMainAction from "renderer/pages/common/StandardMainAction";

const FetchCollection = butlerCaller(messages.FetchCollection);
const CollectionGameSeries = GameSeries(messages.FetchCollectionGames);

class CollectionPage extends React.PureComponent<Props> {
  render() {
    const { profileId, tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);
    const collectionId = sp.firstPathNumber();

    return (
      <FetchCollection
        params={{
          profileId,
          collectionId,
        }}
        loadingHandled
        render={({ result }) => {
          if (!(result && result.collection)) {
            return (
              <EmptyState bigText={"Collection not available"} icon="bug" />
            );
          }
          const coll = result.collection;

          return (
            <CollectionGameSeries
              label={`${coll.title} (${coll.gamesCount})`}
              params={{
                profileId,
                collectionId,
                cursor: sp.queryParam("cursor"),
              }}
              getGame={cg => cg.game}
              renderItemExtras={cave => <StandardMainAction game={cave.game} />}
              renderMainFilters={() => (
                <IconButton
                  icon="redo"
                  hint={["browser.popout"]}
                  hintPosition="bottom"
                  onClick={this.popOutBrowser}
                />
              )}
            />
          );
        }}
      />
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
  tabInstance: TabInstance;
  tab: string;
  dispatch: Dispatch;
}

export default withProfileId(
  withTabInstance(withTab(withDispatch(CollectionPage)))
);
