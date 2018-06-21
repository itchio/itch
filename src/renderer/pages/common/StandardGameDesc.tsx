import React from "react";
import { urlForGame } from "common/util/navigation";
import { Game } from "common/butlerd/messages";
import { TitleBox, Title } from "renderer/pages/PageStyles/games";

export default ({ game, children }: { game: Game; children?: any }) => (
  <TitleBox>
    <a href={urlForGame(game.id)}>
      <Title>
        {game.title}
        {children}
      </Title>
    </a>
    <p>{game.shortText}</p>
  </TitleBox>
);
