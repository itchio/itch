import { actions } from "common/actions";
import { messages } from "common/butlerd";
import { FetchProfileGamesResult } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { ITabInstance } from "common/types";
import { rendererWindow, urlForGame } from "common/util/navigation";
import React from "react";
import Filler from "renderer/basics/Filler";
import FiltersContainer from "renderer/basics/FiltersContainer";
import butlerCaller from "renderer/hocs/butlerCaller";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withProfileId } from "renderer/hocs/withProfileId";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { GameCover } from "renderer/basics/Cover";
import { FormattedNumber } from "react-intl";

const FetchProfileGames = butlerCaller(messages.FetchProfileGames);

const DraftStatus = styled.div`
  font-weight: normal;
  text-transform: lowercase;
  font-size: ${props => props.theme.fontSizes.baseText};
  color: ${props => props.theme.bundle};
  margin-left: 1em;
`;

const CoverBox = styled.div`
  width: 150px;
  margin-right: 14px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
`;

const TitleBox = styled.div`
  padding: 8px 0;
  align-self: flex-start;
`;

const StatGroup = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const StatBox = styled.div`
  padding: 0 4px;
  margin: 4px;
  margin-right: 16px;
  font-size: ${props => props.theme.fontSizes.baseText};
  color: ${props => props.theme.secondaryText};
  line-height: 1.4;
`;

const StatNumber = styled.div`
  font-weight: bolder;
  font-size: ${props => props.theme.fontSizes.larger};
  color: ${props => props.theme.baseText};
  min-width: 3em;
`;

const Title = styled.div`
  font-size: ${props => props.theme.fontSizes.huge};
  font-weight: lighter;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const DashboardDiv = styled.div`
  ${styles.meat()};

  .list {
    overflow-y: auto;
    padding: 0 12px;
  }

  .item {
    ${styles.boxy()};
    max-width: 1200px;

    margin: 8px auto;
    line-height: 1.6;
    font-size: 120%;
  }
`;

class DashboardPage extends React.PureComponent<Props> {
  render() {
    const { profileId, tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);

    return (
      <DashboardDiv>
        <FetchProfileGames
          params={{ profileId, limit: 15, cursor: sp.queryParam("cursor") }}
          sequence={this.props.sequence}
          onResult={result => {
            this.props.dispatch(
              actions.tabDataFetched({
                window: rendererWindow(),
                tab: this.props.tab,
                data: { label: ["sidebar.dashboard"] },
              })
            );
          }}
          loadingHandled
          render={({ result, loading }) => {
            return (
              <>
                <FiltersContainer loading={loading} />
                <div className="list">{this.renderProfileGames(result)}</div>
              </>
            );
          }}
        />
      </DashboardDiv>
    );
  }

  renderProfileGames(result: FetchProfileGamesResult) {
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
        {items.map(pg => {
          if (!pg) {
            return null;
          }

          return (
            <div className="item" key={pg.game.id}>
              <StatGroup>
                <CoverBox>
                  <GameCover game={pg.game} />
                </CoverBox>
                <TitleBox>
                  <a href={urlForGame(pg.game.id)}>
                    <Title>
                      {pg.game.title}
                      <Filler />
                      {pg.published ? null : <DraftStatus>Draft</DraftStatus>}
                    </Title>
                  </a>
                  <p>{pg.game.shortText}</p>
                </TitleBox>
                <Filler />
                <StatBox>
                  <StatNumber>
                    <FormattedNumber value={pg.viewsCount} />
                  </StatNumber>{" "}
                  views
                </StatBox>
                <StatBox>
                  <StatNumber>
                    <FormattedNumber value={pg.downloadsCount} />
                  </StatNumber>{" "}
                  downloads
                </StatBox>
                <StatBox>
                  <StatNumber>
                    <FormattedNumber value={pg.purchasesCount} />
                  </StatNumber>{" "}
                  purchases
                </StatBox>
              </StatGroup>
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
  tabInstance: ITabInstance;
}

export default withTab(
  withProfileId(withTabInstance(withDispatch(DashboardPage)))
);
