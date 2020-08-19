import classNames from "classnames";
import { actions } from "common/actions";
import { Game } from "common/butlerd/messages";
import { ambientWind, urlForGame } from "common/util/navigation";
import React from "react";
import Cover from "renderer/basics/Cover";
import Filler from "renderer/basics/Filler";
import { whenClickNavigates } from "renderer/helpers/whenClickNavigates";
import { hook } from "renderer/hocs/hook";
import styled, * as styles from "renderer/styles";
import { Dispatch } from "common/types";
import { T } from "renderer/t";
import watching, { Watcher } from "renderer/hocs/watching";
import { findDOMNode } from "react-dom";

const GameSearchResultDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  padding: 4px 8px;
  padding-left: 12px;

  flex-shrink: 0;

  border-left: 1px solid transparent;

  &.chosen {
    background-color: ${(props) => props.theme.sidebarEntryFocusedBackground};
    border-color: ${(props) => props.theme.accent};
    cursor: pointer;
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
  }

  .cover-container {
    flex-shrink: 0;
    width: ${80 * 1}px;

    display: flex;
    flex-direction: row;
    align-items: flex-start;

    .cover {
      width: 100%;
    }
  }
`;

const SectionDiv = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;

  overflow-x: hidden;
  ${styles.singleLine};
  line-height: 1.4;
`;

const TitleDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Title = styled.span`
  font-size: ${(props) => props.theme.fontSizes.smaller};
  ${styles.singleLine};

  &.chosen {
    font-size: ${(props) => props.theme.fontSizes.larger};
  }
`;

const ShortText = styled.span`
  font-size: ${(props) => props.theme.fontSizes.smaller};
  color: ${(props) => props.theme.secondaryText};
  margin-right: 8px;
  overflow-x: hidden;
  text-overflow: ellipsis;
  word-wrap: break-all;
  white-space: normal;
`;

@watching
class GameSearchResult extends React.PureComponent<Props> {
  subscribe(watcher: Watcher) {
    watcher.on(actions.commandOk, async (store, action) => {
      if (this.props.chosen && this.props.active && !this.props.loading) {
        store.dispatch(this.getNavigateAction());
        store.dispatch(actions.closeSearch({}));
      }
    });
  }

  componentDidUpdate() {
    if (this.props.chosen) {
      const node = findDOMNode(this);
      if (node) {
        (node as any).scrollIntoViewIfNeeded();
      }
    }
  }

  render() {
    const { game, chosen } = this.props;
    const { title, stillCoverUrl, coverUrl } = game;

    const resultClasses = classNames("game-search-result", {
      chosen: chosen,
    });

    return (
      <GameSearchResultDiv
        className={resultClasses}
        onMouseDown={this.onClick}
        onMouseEnter={this.onEnter}
        data-game-id={game.id}
      >
        <SectionDiv>
          <TitleDiv>
            <Title className={classNames({ chosen })}>{title}</Title>
            <Filler />
          </TitleDiv>
          {chosen ? (
            <TitleDiv>
              <ShortText>
                {game.shortText && game.shortText !== ""
                  ? game.shortText
                  : T(["search.results.game.no_description"])}
              </ShortText>
              {game.user ? (
                <ShortText>
                  By {game.user.displayName || game.user.username}
                </ShortText>
              ) : null}
            </TitleDiv>
          ) : null}
        </SectionDiv>
        {chosen ? (
          <>
            <Filler />
            <div className="cover-container">
              <Cover
                hover={false}
                showGifMarker={false}
                className="cover"
                gameId={game.id}
                coverUrl={coverUrl}
                stillCoverUrl={stillCoverUrl}
              />
            </div>
          </>
        ) : null}
      </GameSearchResultDiv>
    );
  }

  onClick = (ev: React.MouseEvent<any>) => {
    whenClickNavigates(ev, ({ background }) => {
      if (background) {
        ev.preventDefault();
      }

      const { game, dispatch } = this.props;
      dispatch(
        actions.navigate({
          wind: ambientWind(),
          url: urlForGame(game.id),
          background,
        })
      );
      dispatch(actions.closeSearch({}));
    });
  };

  onEnter = (ev: React.MouseEvent<any>) => {
    this.props.setSearchHighlight(this.props.index);
  };

  getNavigateAction() {
    const { game } = this.props;
    return actions.navigate({
      wind: ambientWind(),
      url: urlForGame(game.id),
    });
  }
}

export type SetSearchHighlightFunc = (index: number) => void;

interface Props {
  game: Game;
  chosen: boolean;
  active: boolean;
  loading: boolean;
  index: number;
  dispatch: Dispatch;
  setSearchHighlight: SetSearchHighlightFunc;
}

export default hook()(GameSearchResult);
