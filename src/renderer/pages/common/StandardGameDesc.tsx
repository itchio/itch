import React from "react";
import { urlForGame } from "common/util/navigation";
import { Game, GameClassification } from "common/butlerd/messages";
import { TitleBox, Title } from "renderer/pages/PageStyles/games";
import { T } from "renderer/t";
import Filler from "renderer/basics/Filler";
import PlatformIcons from "renderer/basics/PlatformIcons";

export default ({ game, children }: { game: Game; children?: any }) => (
  <TitleBox>
    <a href={urlForGame(game.id)}>
      <Title>
        {game.title}
        {children}
      </Title>
    </a>
    <p>{game.shortText}</p>
    <Filler />
    <p>
      {renderClassification(game.classification)}
      <PlatformIcons target={game} before={() => <>&nbsp;&nbsp;</>} />
    </p>
  </TitleBox>
);

function renderClassification(classification: GameClassification) {
  let label = [`usage_stats.description.${classification}`];

  return <>{T(label)}</>;
}
