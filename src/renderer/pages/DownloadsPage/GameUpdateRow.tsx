import { GameUpdate } from "common/butlerd/messages";
import { rendererWindow, urlForGame } from "common/util/navigation";
import React from "react";
import { HoverCover } from "renderer/basics/Cover";
import Filler from "renderer/basics/Filler";
import Link from "renderer/basics/Link";
import TimeAgo from "renderer/basics/TimeAgo";
import { doesEventMeanBackground } from "renderer/helpers/whenClickNavigates";
import styled from "renderer/styles";
import { T } from "renderer/t";
import {
  actionCreatorsList,
  connect,
  Dispatchers,
} from "renderer/hocs/connect";

const GameUpdateRowDiv = styled.div`
  flex-shrink: 0;
  line-height: 1.6;

  background-color: ${props => props.theme.itemBackground};

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
  color: ${props => props.theme.secondaryText};
`;

const VersionInfo = styled.div`
  color: ${props => props.theme.secondaryText};
`;

class GameUpdateRow extends React.PureComponent<Props & DerivedProps> {
  render() {
    const { update } = this.props;
    const { game, upload, build } = update;

    let updatedAt = build ? build.updatedAt : upload.updatedAt;
    let versionInfo = build
      ? build.userVersion
        ? `v${build.userVersion}`
        : `#${build.version}`
      : upload.displayName || upload.filename;

    return (
      <GameUpdateRowDiv>
        <GameCover>
          <HoverCover
            gameId={game.id}
            coverUrl={game.coverUrl}
            stillCoverUrl={game.stillCoverUrl}
            showGifMarker={false}
            onClick={this.onNavigate}
          />
        </GameCover>
        <GameUpdateInfo>
          <GameTitle onClick={this.onNavigate}>{game.title}</GameTitle>
          <VersionInfo>
            {versionInfo} — <StyledTimeAgo date={updatedAt} />
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
    const { update, queueGameUpdate } = this.props;
    queueGameUpdate({ update });
  };

  onNavigate = (e: React.MouseEvent<any>) => {
    const { update, navigate } = this.props;
    const { game } = update;

    navigate({
      window: rendererWindow(),
      url: urlForGame(game.id),
      background: doesEventMeanBackground(e),
    });
  };
}

interface Props {
  update: GameUpdate;
}

const actionCreators = actionCreatorsList("navigate", "queueGameUpdate");

type DerivedProps = Dispatchers<typeof actionCreators> & {};

export default connect<Props>(
  GameUpdateRow,
  { actionCreators }
);
