import { actions } from "common/actions";
import { getCaveSummary } from "common/butlerd";
import { Upload } from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { showInExplorerString } from "common/format/show-in-explorer";
import {
  formatUploadTitle,
  formatBuildVersionInfo,
} from "common/format/upload";
import { ManageCaveParams, ManageCaveResponse } from "common/modals/types";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import Button from "renderer/basics/Button";
import Cover from "renderer/basics/Cover";
import Icon from "renderer/basics/Icon";
import LastPlayed from "renderer/basics/LastPlayed";
import RowButton, {
  BigButtonContent,
  BigButtonRow,
  Tag,
} from "renderer/basics/RowButton";
import TimeAgo from "renderer/basics/TimeAgo";
import TotalPlaytime from "renderer/basics/TotalPlaytime";
import UploadIcon from "renderer/basics/UploadIcon";
import { hook } from "renderer/hocs/hook";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { ModalWidgetProps } from "common/modals";
import { ModalButtons, ModalButtonSpacer } from "renderer/basics/modal-styles";
import Filler from "renderer/basics/Filler";

const CaveItem = styled.div`
  padding: 4px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  .time-ago,
  .total-playtime {
    color: ${(props) => props.theme.secondaryText} !important;
  }
`;

const CaveDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const CaveDetailsRow = styled.div`
  padding: 8px 0;

  display: flex;
  flex-direction: row;
  align-items: center;

  &.smaller {
    font-size: 90%;
  }
`;

const Spacer = styled.div`
  height: 1px;
  width: 8px;
`;

const SpacerLarge = styled.div`
  height: 1px;
  width: 16px;
`;

const CaveItemBigActions = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  margin-bottom: 20px;

  & > * {
    margin-right: 4px;
  }
`;

const Title = styled.div`
  font-weight: bold;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

const FileSize = styled.div`
  font-weight: normal;
`;

const ManageCaveDiv = styled(ModalWidgetDiv)`
  min-width: 600px;
`;

class ManageCave extends React.PureComponent<Props> {
  render() {
    return <ManageCaveDiv>{this.renderCave()}</ManageCaveDiv>;
  }

  renderCave(): JSX.Element {
    const { cave } = this.props.modal.widgetParams;
    const { game } = cave;

    const u = cave.upload;
    const caveSummary = getCaveSummary(cave);
    return (
      <CaveItem key={cave.id}>
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <CaveDetails>
            <CaveDetailsRow>
              <Title>{formatUpload(u)}</Title>
            </CaveDetailsRow>
            {cave.build ? (
              <>
                <CaveDetailsRow className="smaller">
                  <Icon icon="pin" />
                  <Spacer />
                  {formatBuildVersionInfo(cave.build)}
                  <Spacer />
                  <TimeAgo date={cave.build.createdAt} />
                  <SpacerLarge />
                  <Icon icon="checkmark" />
                  <Spacer />
                  {T(["table.column.powered_by"])}
                  &nbsp;
                  <a target="_popout" href="https://itch.io/docs/butler/">
                    butler
                  </a>
                </CaveDetailsRow>
              </>
            ) : null}
            <CaveDetailsRow className="smaller">
              <Icon icon="tag" />
              <Spacer />
              {T(["table.column.published"])}
              <Spacer />
              {u ? <TimeAgo date={u.createdAt} /> : null}
              <SpacerLarge />
              <Icon icon="install" />
              <Spacer />
              {T(["table.column.installed"])}
              <Spacer />
              <TimeAgo date={cave.stats.installedAt} />
            </CaveDetailsRow>
            <CaveDetailsRow className="smaller">
              <Icon icon="history" />
              <Spacer />
              <LastPlayed game={game} cave={caveSummary} />
              <SpacerLarge />
              <Icon icon="stopwatch" />
              <Spacer />
              <TotalPlaytime game={game} cave={caveSummary} />
            </CaveDetailsRow>
          </CaveDetails>
          <div style={{ width: "60px" }}>
            <Cover
              hover={false}
              gameId={game.id}
              coverUrl={game.coverUrl}
              stillCoverUrl={game.stillCoverUrl}
            />
          </div>
        </div>
        <CaveItemBigActions>
          <RowButton icon="folder-open" onClick={this.onExplore}>
            <BigButtonContent>
              <BigButtonRow>{T(showInExplorerString())}</BigButtonRow>
              <BigButtonRow>
                <Tag>{cave.installInfo.installFolder}</Tag>
                {cave.installInfo.installedSize ? (
                  <Tag>
                    <FileSize>
                      {fileSize(cave.installInfo.installedSize)}
                    </FileSize>
                  </Tag>
                ) : null}
              </BigButtonRow>
            </BigButtonContent>
          </RowButton>
          <RowButton icon="repeat" onClick={this.onUpdateCheck}>
            <BigButtonContent>
              <BigButtonRow>{T(["grid.item.check_for_update"])}</BigButtonRow>
            </BigButtonContent>
          </RowButton>

          {u ? (
            <>
              {u.channelName == "" ? (
                ""
              ) : (
                <RowButton icon="shuffle" onClick={this.onSwitchVersion}>
                  {T(["grid.item.revert_to_version"])}
                </RowButton>
              )}
            </>
          ) : null}
        </CaveItemBigActions>
        <ModalButtons>
          <Button icon="arrow-left" onClick={this.onBack}>
            {T(["prompt.action.back"])}
          </Button>
          <Filler />
          <Button
            icon="repeat"
            onClick={this.onReinstall}
            className="manage-reinstall"
          >
            {T(["prompt.uninstall.reinstall"])}
          </Button>
          <ModalButtonSpacer />
          <Button
            icon="uninstall"
            onClick={this.onUninstall}
            className="manage-uninstall"
          >
            {T(["prompt.uninstall.uninstall"])}
          </Button>
        </ModalButtons>
      </CaveItem>
    );
  }

  onSwitchVersion = (ev: React.MouseEvent<HTMLElement>) => {
    const cave = this.props.modal.widgetParams.cave;
    const { dispatch } = this.props;
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        action: actions.switchVersionCaveRequest({ cave }),
      })
    );
  };

  onBack = () => {
    const { dispatch } = this.props;
    const { wind, id } = this.props.modal;
    const { game } = this.props.modal.widgetParams.cave;
    dispatch(
      actions.closeModal({
        wind,
        id,
        action: actions.manageGame({ game }),
      })
    );
  };

  onUninstall = (ev: React.MouseEvent<HTMLElement>) => {
    const caveId = this.props.modal.widgetParams.cave.id;
    const { dispatch } = this.props;
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        action: actions.queueCaveUninstall({ caveId }),
      })
    );
  };

  onReinstall = (ev: React.MouseEvent<HTMLElement>) => {
    const caveId = this.props.modal.widgetParams.cave.id;
    const { dispatch } = this.props;
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        action: actions.queueCaveReinstall({ caveId }),
      })
    );
  };

  onUpdateCheck = (ev: React.MouseEvent<HTMLElement>) => {
    const caveId = this.props.modal.widgetParams.cave.id;
    const { dispatch } = this.props;
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        action: actions.checkForGameUpdate({ caveId }),
      })
    );
  };

  onExplore = (ev: React.MouseEvent<HTMLElement>) => {
    const caveId = this.props.modal.widgetParams.cave.id;
    const { dispatch } = this.props;
    dispatch(actions.exploreCave({ caveId }));
  };
}

interface Props extends ModalWidgetProps<ManageCaveParams, ManageCaveResponse> {
  dispatch: Dispatch;
}

export default hook()(ManageCave);

function formatUpload(upload: Upload): JSX.Element {
  return (
    <>
      <UploadIcon upload={upload} />
      <Spacer />
      {formatUploadTitle(upload)}
    </>
  );
}
