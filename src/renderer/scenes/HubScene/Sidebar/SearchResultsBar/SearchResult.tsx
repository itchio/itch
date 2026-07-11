import classNames from "classnames";
import { actions } from "common/actions";
import { Dispatch, LocalizedString } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import Cover from "renderer/basics/Cover";
import { whenClickNavigates } from "renderer/helpers/whenClickNavigates";
import { hook } from "renderer/hocs/hook";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";

export type LocalSearchResultKind = "game" | "bundle" | "collection";

export interface LocalSearchResult {
  kind: LocalSearchResultKind;
  id: number;
  title: string;
  coverUrl?: string;
  stillCoverUrl?: string;
  subtitle?: LocalizedString;
  url: string;
}

export interface LocalSearchSection {
  labelKey: string;
  results: LocalSearchResult[];
}

const SearchResultDiv = styled.div`
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

const IconPlaceholder = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.theme.secondaryText};
  font-size: 24px;
`;

const iconForKind: Record<LocalSearchResultKind, string> = {
  game: "gamepad",
  bundle: "grid",
  collection: "video_collection",
};

class SearchResult extends React.PureComponent<Props> {
  private divRef = React.createRef<HTMLDivElement>();

  override componentDidUpdate() {
    if (this.props.chosen && this.divRef.current) {
      this.divRef.current.scrollIntoView({ block: "nearest" });
    }
  }

  override render() {
    const { result, chosen } = this.props;

    return (
      <SearchResultDiv
        ref={this.divRef}
        className={classNames("search-result", { chosen })}
        data-result-kind={result.kind}
        data-result-id={result.id}
        onMouseDown={this.onClick}
        onMouseMove={this.onMouseMove}
      >
        <SectionDiv>
          <TitleDiv>
            <Title>{result.title}</Title>
          </TitleDiv>
          {result.subtitle ? <ShortText>{T(result.subtitle)}</ShortText> : null}
        </SectionDiv>
        <div className="cover-container">
          {result.coverUrl ? (
            <Cover
              hover={false}
              showGifMarker={false}
              className="cover"
              gameId={result.kind === "game" ? result.id : 0}
              coverUrl={result.coverUrl}
              stillCoverUrl={result.stillCoverUrl}
            />
          ) : (
            <IconPlaceholder
              className={`icon icon-${iconForKind[result.kind]}`}
            />
          )}
        </div>
      </SearchResultDiv>
    );
  }

  onClick = (ev: React.MouseEvent<any>) => {
    whenClickNavigates(ev, ({ background }) => {
      if (background) {
        ev.preventDefault();
      }

      const { result, dispatch } = this.props;
      dispatch(
        actions.navigate({
          wind: ambientWind(),
          url: result.url,
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
  result: LocalSearchResult;
  chosen: boolean;
  index: number;
  dispatch: Dispatch;
  setSearchHighlight: SetSearchHighlightFunc;
}

export default hook()(SearchResult);
