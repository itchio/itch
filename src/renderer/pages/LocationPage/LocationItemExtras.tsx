import React from "react";
import { Cave } from "common/butlerd/messages";
import styled from "renderer/styles";
import StandardMainAction from "renderer/pages/common/StandardMainAction";
import TotalPlaytime from "renderer/basics/TotalPlaytime";
import LastPlayed from "renderer/basics/LastPlayed";
import GameStatusGetter from "renderer/basics/GameStatusGetter";
import { formatUploadTitle } from "common/format/upload";
import { truncate } from "common/format/truncate";
import { FilterSpacer } from "renderer/pages/common/SortsAndFilters";
import { fileSize } from "common/format/filesize";
import { T } from "renderer/t";
import Link from "renderer/basics/Link";
import { Dispatch } from "common/types";
import { actions } from "common/actions";
import { hook } from "renderer/hocs/hook";
import { GameStatus } from "common/helpers/get-game-status";

const ExtrasDiv = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-items: flex-start;
`;

const SizeDiv = styled.div`
  white-space: nowrap;
  flex-shrink: 0;
  min-width: 260px;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

class LocationItemExtras extends React.PureComponent<Props> {
  render() {
    const { cave } = this.props;
    return (
      <>
        <ExtrasDiv>
          <FilterSpacer />
          <div title={formatUploadTitle(cave.upload)}>
            {truncate(formatUploadTitle(cave.upload), {
              length: 20,
            })}
          </div>
          <GameStatusGetter
            game={cave.game}
            caveId={cave.id}
            render={this.renderPlayStats}
          />
          <SizeDiv>
            {T([
              "install_location.property.size_on_disk",
              { size: fileSize(cave.installInfo.installedSize) },
            ])}
            <FilterSpacer />
            <Link label={T(["grid.item.manage"])} onClick={this.onManage} />
          </SizeDiv>
        </ExtrasDiv>
        <StandardMainAction game={cave.game} />
      </>
    );
  }

  renderPlayStats = (status: GameStatus) => {
    const { cave } = this.props;
    return (
      <>
        <TotalPlaytime game={cave.game} cave={status.cave} />
        <LastPlayed game={cave.game} cave={status.cave} />
      </>
    );
  };

  onManage = () => {
    const { dispatch, cave } = this.props;
    dispatch(
      actions.manageCave({
        caveId: cave.id,
      })
    );
  };
}

interface Props {
  cave: Cave;

  dispatch: Dispatch;
}

export default hook()(LocationItemExtras);
