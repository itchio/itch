import { Game, GameClassification } from "common/butlerd/messages";
import { urlForGame } from "common/util/navigation";
import Filler from "renderer/basics/Filler";
import PlatformIcons from "renderer/basics/PlatformIcons";
import { Title, TitleBox } from "renderer/pages/PageStyles/games";
import { T } from "renderer/t";

// `hideDetails` drops the short description and the classification/platforms
// line - for lists where the game is already installed and only the title
// and per-install info matter.
const StandardGameDesc = ({
  game,
  hideDetails,
  children,
}: {
  game: Game | undefined;
  hideDetails?: boolean;
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
      {hideDetails ? null : <div>{game.shortText}</div>}
      {children}
      <Filler />
      {hideDetails ? null : (
        <div>
          {renderClassification(game.classification)}
          <PlatformIcons target={game} before={() => <>&nbsp;&nbsp;</>} />
        </div>
      )}
    </TitleBox>
  );
};

export default StandardGameDesc;

function renderClassification(classification: GameClassification) {
  let label = [`usage_stats.description.${classification}`];

  return <>{T(label)}</>;
}
