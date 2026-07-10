import classNames from "classnames";
import { actions } from "common/actions";
import { Game } from "common/butlerd/messages";
import { ambientWind, urlForGame } from "common/util/navigation";
import React from "react";
import Cover from "renderer/basics/Cover";
import { whenClickNavigates } from "renderer/helpers/whenClickNavigates";
import { hook } from "renderer/hocs/hook";
import styled, * as styles from "renderer/styles";
import { Dispatch } from "common/types";
import { T } from "renderer/t";

const GameSearchResultDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  box-sizing: border-box;
  height: 58px;
  padding: 5px 8px;
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
    width: 54px;

    display: flex;
    align-items: center;

    .cover {
      width: 100%;
    }
  }
`;

const SectionDiv = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
  min-width: 0;
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
`;

const ShortText = styled.span`
  font-size: ${(props) => props.theme.fontSizes.smaller};
  color: ${(props) => props.theme.secondaryText};
  ${styles.singleLine};
`;

class GameSearchResult extends React.PureComponent<Props> {
  private divRef = React.createRef<HTMLDivElement>();

  override componentDidUpdate() {
    if (this.props.chosen && this.divRef.current) {
      this.divRef.current.scrollIntoView({ block: "nearest" });
    }
  }

  override render() {
    const { game, chosen } = this.props;
    const { title, stillCoverUrl, coverUrl } = game;

    const resultClasses = classNames("game-search-result", {
      chosen: chosen,
    });

    return (
      <GameSearchResultDiv
        ref={this.divRef}
        className={resultClasses}
        onMouseDown={this.onClick}
        onMouseMove={this.onMouseMove}
        data-game-id={game.id}
      >
        <SectionDiv>
          <TitleDiv>
            <Title>{title}</Title>
          </TitleDiv>
          <ShortText>
            {game.shortText && game.shortText !== ""
              ? game.shortText
              : T(["search.results.game.no_description"])}
          </ShortText>
        </SectionDiv>
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

  onMouseMove = (ev: React.MouseEvent<any>) => {
    this.props.setSearchHighlight(this.props.index);
  };
}

export type SetSearchHighlightFunc = (index: number) => void;

interface Props {
  game: Game;
  chosen: boolean;
  index: number;
  dispatch: Dispatch;
  setSearchHighlight: SetSearchHighlightFunc;
}

export default hook()(GameSearchResult);
