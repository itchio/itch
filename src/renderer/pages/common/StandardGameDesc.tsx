import { messages } from "common/butlerd";
import { Game, GameClassification, Profile } from "common/butlerd/messages";
import { urlForGame } from "common/util/navigation";
import React from "react";
import Filler from "renderer/basics/Filler";
import PlatformIcons from "renderer/basics/PlatformIcons";
import butlerCaller from "renderer/hocs/butlerCaller";
import { withProfile } from "renderer/hocs/withProfile";
import { Title, TitleBox } from "renderer/pages/PageStyles/games";
import { T } from "renderer/t";

const FetchUser = butlerCaller(messages.FetchUser);

const StandardGameDesc = ({
  game,
  children,
  profile,
}: {
  game: Game;
  children?: any;
  profile: Profile;
}) => (
  <TitleBox>
    <a href={urlForGame(game.id)} className="gamedesc--titlelink">
      <Title>
        <div className="gamedesc--title">{game.title}</div>
        {children}
      </Title>
    </a>
    <div>{game.shortText}</div>
    <Filler />
    <div>
      {renderClassification(game.classification)}
      <PlatformIcons target={game} before={() => <>&nbsp;&nbsp;</>} />
      {!game.userId ? null : (
        <FetchUser
          params={{ profileId: profile.id, userId: game.userId }}
          render={({ result }) => {
            if (!result || !result.user) {
              return null;
            }
            const { user } = result;

            return (
              <>
                &nbsp;&nbsp;by&nbsp;&nbsp;
                <a href={user.url}>
                  <img
                    src={user.stillCoverUrl || user.coverUrl}
                    style={{
                      width: "1em",
                      height: "1em",
                      borderRadius: "4px",
                      marginRight: ".5em",
                    }}
                  />
                  {result.user.username}
                </a>
              </>
            );
          }}
        />
      )}
    </div>
  </TitleBox>
);

export default withProfile(StandardGameDesc);

function renderClassification(classification: GameClassification) {
  let label = [`usage_stats.description.${classification}`];

  return <>{T(label)}</>;
}
