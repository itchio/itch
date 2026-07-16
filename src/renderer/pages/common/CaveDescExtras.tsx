import React from "react";
import { Cave } from "common/butlerd/messages";
import styled from "renderer/styles";
import TotalPlaytime from "renderer/basics/TotalPlaytime";
import LastPlayed from "renderer/basics/LastPlayed";
import GameStatusGetter from "renderer/basics/GameStatusGetter";
import { formatUploadTitle } from "common/format/upload";
import { FilterSpacer } from "renderer/pages/common/SortsAndFilters";
import { fileSize } from "common/format/filesize";
import { T } from "renderer/t";
import { GameStatus } from "common/helpers/get-game-status";

const CaveInfoRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;

  margin-top: 0.4em;
  font-size: 90%;
  color: ${(props) => props.theme.secondaryText};
`;

const UploadTitleDiv = styled.div`
  font-weight: bold;
`;

class CaveDescExtras extends React.PureComponent<Props> {
  override render() {
    const { cave } = this.props;
    return (
      <CaveInfoRow>
        <UploadTitleDiv>{formatUploadTitle(cave.upload)}</UploadTitleDiv>
        <FilterSpacer />
        {T([
          "install_location.property.size_on_disk",
          { size: fileSize(cave.installInfo.installedSize) },
        ])}
        <FilterSpacer />
        <GameStatusGetter
          game={cave.game}
          caveId={cave.id}
          render={this.renderPlayStats}
        />
      </CaveInfoRow>
    );
  }

  renderPlayStats = (status: GameStatus) => {
    const { cave } = this.props;
    return (
      <>
        <TotalPlaytime game={cave.game} cave={status.cave} />
        <FilterSpacer />
        <LastPlayed game={cave.game} cave={status.cave} />
      </>
    );
  };
}

interface Props {
  cave: Cave;
}

export default CaveDescExtras;
