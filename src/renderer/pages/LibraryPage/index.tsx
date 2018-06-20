import React from "react";

import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import { T } from "renderer/t";
import FiltersContainer from "renderer/basics/FiltersContainer";
import Page from "renderer/pages/common/Page";
import {
  TitleBox,
  Title,
  StandardGameCover,
} from "renderer/pages/PageStyles/games";
import ItemList from "renderer/pages/common/ItemList";
import butlerCaller from "renderer/hocs/butlerCaller";
import { messages } from "common/butlerd";
import { BoxInner, BaseBox } from "renderer/pages/PageStyles/boxes";
import { isEmpty } from "underscore";
import { withProfileId } from "renderer/hocs/withProfileId";
import styled from "renderer/styles";
import { Game } from "common/butlerd/messages";

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
    const { profileId } = this.props;

    return (
      <Page>
        <FiltersContainer loading={false} />

        <ItemList>
          <TitleBox>
            <Title>
              <a href="itch://library/owned">{T(["sidebar.owned"])}</a>
            </Title>
            <FetchProfileOwnedKeys
              params={{ profileId, limit: 12 }}
              render={({ result }) => {
                const { items } = result;
                if (isEmpty(items)) {
                  return null;
                }

                return (
                  <TiltedBox>
                    <BoxInner>
                      {items.map(dk => {
                        return <TiltedGameCover key={dk.id} game={dk.game} />;
                      })}
                    </BoxInner>
                  </TiltedBox>
                );
              }}
            />
          </TitleBox>

          <TitleBox>
            <Title>
              <a href="itch://library/installed">{T(["sidebar.installed"])}</a>
            </Title>
            <FetchCaves
              params={{ limit: 12, sortBy: "lastTouched" }}
              render={({ result }) => {
                const { items } = result;
                if (isEmpty(items)) {
                  return null;
                }

                return (
                  <TiltedBox>
                    <BoxInner>
                      {items.map(cave => {
                        return (
                          <TiltedGameCover key={cave.id} game={cave.game} />
                        );
                      })}
                    </BoxInner>
                  </TiltedBox>
                );
              }}
            />
          </TitleBox>
        </ItemList>
      </Page>
    );
  }
}

interface Props extends MeatProps {
  profileId: number;
}

export default withProfileId(LibraryPage);
