import { Game, GameClassification } from "common/butlerd/messages";
import { urlForGame } from "common/util/navigation";
import Filler from "renderer/basics/Filler";
import PlatformIcons from "renderer/basics/PlatformIcons";
import { Title, TitleBox } from "renderer/pages/PageStyles/games";
import { T } from "renderer/t";

const StandardGameDesc = ({
  game,
  children,
}: {
  game: Game | undefined;
  children?: any;
}) => {
  if (!game) {
    return (
      <TitleBox>
        <Title />
      </TitleBox>
    );
  }
  return (
    <TitleBox>
      <a href={urlForGame(game.id)} className="gamedesc--titlelink">
        <Title>
          <div className="gamedesc--title">{game.title}</div>
        </Title>
      </a>
      <div>{game.shortText}</div>
      {children}
      <Filler />
      <div>
        {renderClassification(game.classification)}
        <PlatformIcons target={game} before={() => <>&nbsp;&nbsp;</>} />
      </div>
    </TitleBox>
  );
};

export default StandardGameDesc;

function renderClassification(classification: GameClassification) {
  let label = [`usage_stats.description.${classification}`];

  return <>{T(label)}</>;
}
