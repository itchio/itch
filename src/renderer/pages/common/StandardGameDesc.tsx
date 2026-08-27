import { Game, GameClassification } from "common/butlerd/messages";
import { urlForGame } from "common/util/navigation";
import Filler from "renderer/basics/Filler";
import PlatformIcons from "renderer/basics/PlatformIcons";
import { Title, TitleBox } from "renderer/pages/PageStyles/games";
import { T } from "renderer/t";

// `hideDetails` drops the short description and the classification/platforms
// line - for lists where the game is already installed and only the title
// and per-install info matter.
// `disableLink` renders the title as plain text - for dialogs, where
// navigating away behind the modal is bad UX.
const StandardGameDesc = ({
  game,
  hideDetails,
  disableLink,
  children,
}: {
  game: Game | undefined;
  hideDetails?: boolean;
  disableLink?: boolean;
  children?: any;
}) => {
  if (!game) {
    return (
      <TitleBox>
        <Title />
      </TitleBox>
    );
  }
  const title = (
    <Title>
      <div className="gamedesc--title">{game.title}</div>
    </Title>
  );
  return (
    <TitleBox>
      {disableLink ? (
        title
      ) : (
        <a href={urlForGame(game.id)} className="gamedesc--titlelink">
          {title}
        </a>
      )}
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
