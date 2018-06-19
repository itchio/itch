import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { FetchCavesResult } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { TabInstance } from "common/types";
import { rendererWindow } from "common/util/navigation";
import React from "react";
import butlerCaller from "renderer/hocs/butlerCaller";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import FiltersContainer from "renderer/basics/FiltersContainer";
import { Box, BoxInner } from "renderer/pages/PageStyles/boxes";
import { StandardGameCover } from "renderer/pages/PageStyles/games";
import StandardGameDesc from "renderer/pages/common/StandardGameDesc";

const FetchCaves = butlerCaller(messages.FetchCaves);

const InstalledContainer = styled.div`
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

class InstalledPage extends React.PureComponent<Props> {
  render() {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);

    return (
      <InstalledContainer>
        <FetchCaves
          params={{ limit: 15, cursor: sp.queryParam("cursor") }}
          sequence={this.props.sequence}
          onResult={result => {
            this.props.dispatch(
              actions.tabDataFetched({
                window: rendererWindow(),
                tab: this.props.tab,
                data: { label: ["sidebar.installed"] },
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
      </InstalledContainer>
    );
  }

  renderItems(result: FetchCavesResult) {
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
          const { game } = item;

          return (
            <Box key={item.game.id}>
              <BoxInner>
                <StandardGameCover game={game} />
                <StandardGameDesc game={game} />
              </BoxInner>
            </Box>
          );
        })}
        {nextCursor ? <a href={nextPageURL}>Next page</a> : null}
      </>
    );
  }
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;
  tabInstance: TabInstance;
}

export default withTab(withTabInstance(withDispatch(InstalledPage)));
