import { GameUpdate } from "common/butlerd/messages";
import { Dispatch } from "common/types";
import { ambientWind, urlForGame } from "common/util/navigation";
import React from "react";
import Cover from "renderer/basics/Cover";
import Filler from "renderer/basics/Filler";
import Link from "renderer/basics/Link";
import TimeAgo from "renderer/basics/TimeAgo";
import { doesEventMeanBackground } from "renderer/helpers/whenClickNavigates";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { actions } from "common/actions";
import { formatBuildVersionInfo } from "common/format/upload";

const GameUpdateRowDiv = styled.div`
  flex-shrink: 0;
  line-height: 1.6;

  background-color: ${(props) => props.theme.itemBackground};

  display: flex;
  flex-direction: row;
  align-items: center;

  margin: 0.4em 0;
  padding: 0 4px;
  border-radius: 2px;
`;

const GameUpdateInfo = styled.div`
  margin: 0;
  padding: 8px;
`;

const GameUpdateControls = styled.div`
  margin: 0;
  padding: 8px;
`;

const GameCover = styled.div`
  flex-basis: 60px;
  padding: 8px;
`;

const GameTitle = styled.div`
  display: inline-block;
  font-weight: bold;
  cursor: pointer;
`;

const StyledTimeAgo = styled(TimeAgo)`
  color: ${(props) => props.theme.secondaryText};
`;

const VersionInfo = styled.div`
  color: ${(props) => props.theme.secondaryText};
`;

class GameUpdateRow extends React.PureComponent<Props> {
  render() {
    const { update } = this.props;
    const { game } = update;
    const { upload, build } = update.choices[0];

    let updatedAt = build ? build.updatedAt : upload.updatedAt;
    let versionInfo = formatBuildVersionInfo(build);

    return (
      <GameUpdateRowDiv>
        <GameCover>
          <Cover
            gameId={game.id}
            coverUrl={game.coverUrl}
            stillCoverUrl={game.stillCoverUrl}
            showGifMarker={false}
            onClick={this.onNavigate}
            hover={false}
          />
        </GameCover>
        <GameUpdateInfo>
          <GameTitle onClick={this.onNavigate}>{game.title}</GameTitle>
          <VersionInfo>
            {versionInfo ? <>{versionInfo} — </> : null}
            <StyledTimeAgo date={updatedAt} />
          </VersionInfo>
        </GameUpdateInfo>
        <Filler />
        <GameUpdateControls>
          <Link
            label={T(["pick_update_upload.buttons.update"])}
            onClick={this.onUpdate}
          />
        </GameUpdateControls>
      </GameUpdateRowDiv>
    );
  }

  onUpdate = () => {
    const { update, dispatch } = this.props;
    dispatch(actions.showGameUpdate({ update }));
  };

  onNavigate = (e: React.MouseEvent<any>) => {
    const { update, dispatch } = this.props;
    const { game } = update;

    dispatch(
      actions.navigate({
        wind: "root",
        url: urlForGame(game.id),
        background: doesEventMeanBackground(e),
      })
    );
  };
}

interface Props {
  update: GameUpdate;
  dispatch: Dispatch;
}

export default hook()(GameUpdateRow);
