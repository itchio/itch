import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { FetchProfileOwnedKeysResult } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { TabInstance } from "common/types";
import { rendererWindow, urlForGame } from "common/util/navigation";
import React from "react";
import butlerCaller from "renderer/hocs/butlerCaller";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withProfileId } from "renderer/hocs/withProfileId";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import FiltersContainer from "renderer/basics/FiltersContainer";

const FetchProfileOwnedKeys = butlerCaller(messages.FetchProfileOwnedKeys);

const OwnedContainer = styled.div`
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

class OwnedPage extends React.PureComponent<Props> {
  render() {
    const { profileId, tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);

    return (
      <OwnedContainer>
        <FetchProfileOwnedKeys
          params={{ profileId, limit: 15, cursor: sp.queryParam("cursor") }}
          sequence={this.props.sequence}
          onResult={result => {
            this.props.dispatch(
              actions.tabDataFetched({
                window: rendererWindow(),
                tab: this.props.tab,
                data: { label: ["sidebar.owned"] },
              })
            );
          }}
          loadingHandled
          render={({ result, loading }) => {
            return (
              <>
                <FiltersContainer loading={loading} />
                <div className="list">{this.renderItems(result)}</div>
              </>
            );
          }}
        />
      </OwnedContainer>
    );
  }

  renderItems(result: FetchProfileOwnedKeysResult) {
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
        {items.map(item => {
          if (!item) {
            return null;
          }

          return (
            <div className="item" key={item.game.id}>
              <a href={urlForGame(item.game.id)}>
                <h3>{item.game.title}</h3>
              </a>
              <p>{item.game.shortText}</p>
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
  tabInstance: TabInstance;
}

export default withTab(withProfileId(withTabInstance(withDispatch(OwnedPage))));
