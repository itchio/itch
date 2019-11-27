import { messages } from "common/butlerd";
import { Game } from "common/butlerd/messages";
import React, { useContext } from "react";
import { Container } from "renderer/basics/Container";
import { ErrorState } from "renderer/basics/ErrorState";
import { ProfileContext } from "renderer/Route";
import styled from "renderer/styles";
import { Call } from "renderer/use-butlerd";
import { FormattedMessage } from "react-intl";

let ratio = 0.7;

const CoverImage = styled.img`
  width: ${300 * ratio}px;
  height: ${215 * ratio}px;
  border: 1px solid #333;
  border-radius: 4px;

  margin: 5px;
`;

const GameGridContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const GameGrid = function<T>(props: { items: T[]; getGame: (t: T) => Game }) {
  const { items, getGame } = props;
  return (
    <>
      <GameGridContainer>
        {items.map(getGame).map(game => (
          <a key={game.id} href={`itch://games/${game.id}`}>
            <CoverImage src={game.stillCoverUrl || game.coverUrl} />
          </a>
        ))}
      </GameGridContainer>
    </>
  );
};

export const LibraryPage = () => {
  const profile = useContext(ProfileContext);
  if (!profile) {
    return (
      <ErrorState
        error={new Error("Missing profile - this should never happen")}
      />
    );
  }

  return (
    <Container>
      <h2>
        <FormattedMessage id="sidebar.installed" />
      </h2>
      <Call
        rc={messages.FetchCaves}
        params={{ limit: 15 }}
        render={({ items }) => (
          <GameGrid items={items} getGame={cave => cave.game} />
        )}
      />

      <h2>
        <FormattedMessage id="sidebar.owned" />
      </h2>
      <Call
        rc={messages.FetchProfileOwnedKeys}
        params={{ profileId: profile.id, limit: 15 }}
        render={({ items }) => (
          <GameGrid items={items} getGame={key => key.game} />
        )}
      />

      <p>
        Navigate to <a href="itch://games/3">game 3</a>
      </p>
      <p>
        Navigate to <a href="itch://games/5">game 5</a>
      </p>
      <p>
        Navigate to <a href="itch://games/12">game 12</a>
      </p>
      <p>
        Navigate to <a href="https://itch.io">the itch homepage</a>
      </p>
    </Container>
  );
};
