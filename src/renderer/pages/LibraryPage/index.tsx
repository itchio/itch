import React from "react";

import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { T } from "renderer/t";
import FiltersContainer from "renderer/basics/FiltersContainer";
import Page from "renderer/pages/common/Page";
import {
  TitleBox,
  Title,
  StandardGameCover,
  TitleSpacer,
} from "renderer/pages/PageStyles/games";
import ItemList from "renderer/pages/common/ItemList";
import butlerCaller from "renderer/hocs/butlerCaller";
import { messages } from "common/butlerd";
import { BoxInner, BaseBox } from "renderer/pages/PageStyles/boxes";
import { isEmpty } from "underscore";
import { withProfileId } from "renderer/hocs/withProfileId";
import styled from "renderer/styles";
import {
  Game,
  FetchProfileOwnedKeysResult,
  FetchCavesResult,
} from "common/butlerd/messages";
import LoadingCircle from "renderer/basics/LoadingCircle";
import ErrorState from "renderer/basics/ErrorState";

const FetchProfileOwnedKeys = butlerCaller(messages.FetchProfileOwnedKeys);
const FetchCaves = butlerCaller(messages.FetchCaves);

const TiltedBox = styled(BaseBox)`
  overflow-x: hidden;
`;

const TiltedGameCoverDiv = styled.div`
  perspective: 400px;
  width: 90px;

  & > * {
    display: block;
    transform: rotateX(0deg) rotateY(20deg) rotateZ(0deg) scale(0.75);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    border: 0.5px solid rgba(255, 255, 255, 0.3);
    width: 170px;
  }
`;

const TiltedGameCover = ({ game }: { game: Game }) => (
  <TiltedGameCoverDiv>
    <StandardGameCover game={game} />
  </TiltedGameCoverDiv>
);

class LibraryPage extends React.PureComponent<Props> {
  render() {
    const { profileId, sequence } = this.props;

    return (
      <Page>
        <FiltersContainer loading={false} />

        <ItemList>
          <TitleBox>
            <FetchProfileOwnedKeys
              params={{ profileId, limit: 12 }}
              sequence={sequence}
              loadingHandled
              errorsHandled
              render={({ result, loading, error }) => (
                <>
                  <Title>
                    <a href="itch://library/owned">{T(["sidebar.owned"])}</a>
                    {loading ? (
                      <>
                        <TitleSpacer />
                        <LoadingCircle progress={-1} />
                      </>
                    ) : null}
                  </Title>
                  {error ? (
                    <>
                      <ErrorState error={error} />
                    </>
                  ) : null}
                  <TiltedBox>
                    <BoxInner>{this.renderOwned(result)}</BoxInner>
                  </TiltedBox>
                </>
              )}
            />
          </TitleBox>

          <TitleBox>
            <FetchCaves
              params={{ limit: 12, sortBy: "lastTouched" }}
              sequence={sequence}
              loadingHandled
              errorsHandled
              render={({ result, loading, error }) => (
                <>
                  <Title>
                    <a href="itch://library/installed">
                      {T(["sidebar.installed"])}
                    </a>
                    {loading ? (
                      <>
                        <TitleSpacer />
                        <LoadingCircle progress={-1} />
                      </>
                    ) : null}
                  </Title>
                  {error ? (
                    <>
                      <ErrorState error={error} />
                    </>
                  ) : null}
                  <TiltedBox>
                    <BoxInner>{this.renderInstalled(result)}</BoxInner>
                  </TiltedBox>
                </>
              )}
            />
          </TitleBox>
        </ItemList>
      </Page>
    );
  }

  renderOwned(result: FetchProfileOwnedKeysResult): JSX.Element {
    if (!result) {
      return null;
    }
    const { items } = result;
    if (isEmpty(items)) {
      return null;
    }

    return (
      <>
        {items.map(dk => {
          return <TiltedGameCover key={dk.id} game={dk.game} />;
        })}
      </>
    );
  }

  renderInstalled(result: FetchCavesResult): JSX.Element {
    if (!result) {
      return null;
    }
    const { items } = result;

    if (isEmpty(items)) {
      return null;
    }

    return (
      <>
        {items.map(cave => {
          return <TiltedGameCover key={cave.id} game={cave.game} />;
        })}
      </>
    );
  }
}

interface Props extends MeatProps {
  profileId: number;
}

export default withProfileId(LibraryPage);
