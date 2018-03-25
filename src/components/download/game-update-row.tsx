import * as React from "react";
import { GameUpdate } from "../../butlerd/messages";

import TimeAgo from "../basics/time-ago";
import Filler from "../basics/filler";
import Link from "../basics/link";
import Cover from "../basics/cover";

import styled from "../styles";
import { connect, actionCreatorsList, Dispatchers } from "../connect";
import format from "../format";
import { doesEventMeanBackground } from "../when-click-navigates";

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

class GameUpdateRow extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { update } = this.props;
    const { game, upload, build } = update;

    let updatedAt = build ? build.updatedAt : upload.updatedAt;
    let versionInfo = build
      ? build.userVersion ? `v${build.userVersion}` : `#${build.version}`
      : upload.displayName || upload.filename;

    return (
      <GameUpdateRowDiv>
        <GameCover>
          <Cover
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
            label={format(["pick_update_upload.buttons.update"])}
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
    const { update, navigateToGame } = this.props;
    const { game } = update;

    navigateToGame({
      game,
      background: doesEventMeanBackground(e),
    });
  };
}

interface IProps {
  update: GameUpdate;
}

const actionCreators = actionCreatorsList("navigateToGame", "queueGameUpdate");

type IDerivedProps = Dispatchers<typeof actionCreators> & {};

export default connect<IProps>(GameUpdateRow, { actionCreators });
