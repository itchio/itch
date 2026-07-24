import { actions } from "common/actions";
import { Upload } from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { showInExplorerString } from "common/format/show-in-explorer";
import {
  formatUploadTitle,
  formatBuildVersionInfo,
} from "common/format/upload";
import { ManageCaveParams, ManageCaveResponse } from "common/modals/types";
import { actionForGame } from "common/util/action-for-game";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import Button from "renderer/basics/Button";
import Cover from "renderer/basics/Cover";
import Icon from "renderer/basics/Icon";
import LastPlayed from "renderer/basics/LastPlayed";
import TimeAgo from "renderer/basics/TimeAgo";
import TotalPlaytime from "renderer/basics/TotalPlaytime";
import UploadIcon from "renderer/basics/UploadIcon";
import { hook } from "renderer/hocs/hook";
import CaveLaunchSettings from "renderer/modal-widgets/CaveLaunchSettings";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { ModalWidgetProps } from "common/modals";
import { ModalButtons, ModalButtonSpacer } from "renderer/basics/modal-styles";
import Filler from "renderer/basics/Filler";
import { getCaveSummary } from "common/butlerd/utils";

const CaveItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const CaveDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const CaveDetailsRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  &.smaller {
    font-size: 90%;
  }
`;

/* label reads as secondary, the value it introduces reads as primary —
   so the block scans as four facts, not four sentences */
const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 20px;
  max-width: 420px;

  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.smaller};

  .time-ago,
  .total-playtime {
    color: ${(props) => props.theme.baseText};
    font-weight: bold;
  }
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 7px;
  min-width: 0;

  label {
    font-weight: normal;
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
  gap: 8px;
  align-self: stretch;
`;

const QuickAction = styled.button`
  display: flex;
  align-items: center;
  gap: 14px;
  text-align: left;

  padding: 11px 14px;
  background: ${(props) => props.theme.itemBackground};
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: ${(props) => props.theme.borderRadii.explanation};
  color: ${(props) => props.theme.baseText};
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: #262626;
    border-color: rgba(255, 255, 255, 0.12);
  }
`;

const QuickActionIcon = styled(Icon)`
  flex-shrink: 0;
  font-size: 19px;
  color: ${(props) => props.theme.secondaryText};
`;

const QuickActionLabel = styled.div`
  min-width: 0;
`;

const QuickActionTitle = styled.div`
  font-weight: bold;
  font-size: ${(props) => props.theme.fontSizes.baseText};
`;

const QuickActionSubtitle = styled.div`
  margin-top: 4px;
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.small};
`;

const Title = styled.div`
  font-weight: bold;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ManageCaveDiv = styled(ModalWidgetDiv)`
  min-width: 600px;
  width: 820px;
  max-width: 90vw;
`;

class ManageCave extends React.PureComponent<Props> {
  override render() {
    return <ManageCaveDiv>{this.renderCave()}</ManageCaveDiv>;
  }

  renderCave(): JSX.Element {
    const { cave } = this.props.modal.widgetParams;
    const { game } = cave;

    const u = cave.upload;
    const caveSummary = getCaveSummary(cave);
    const hasLastPlayed = Boolean(caveSummary.interaction?.lastRunAt);
    // mirrors what TotalPlaytime renders — without this the grid would show a
    // stopwatch icon with nothing next to it for a game that's never been played
    const hasPlaytime =
      (caveSummary.interaction?.secondsRun ?? 0) > 0 &&
      actionForGame(game, caveSummary) === "launch";
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
            <MetaGrid>
              <MetaItem>
                <Icon icon="tag" />
                <span>
                  {T(["table.column.published"])}{" "}
                  {u ? <TimeAgo date={u.createdAt} /> : null}
                </span>
              </MetaItem>
              <MetaItem>
                <Icon icon="install" />
                <span>
                  {T(["table.column.installed"])}{" "}
                  <TimeAgo date={cave.stats.installedAt} />
                </span>
              </MetaItem>
              {hasLastPlayed ? (
                <MetaItem>
                  <Icon icon="history" />
                  <LastPlayed game={game} cave={caveSummary} />
                </MetaItem>
              ) : null}
              {hasPlaytime ? (
                <MetaItem>
                  <Icon icon="stopwatch" />
                  <TotalPlaytime game={game} cave={caveSummary} />
                </MetaItem>
              ) : null}
            </MetaGrid>
          </CaveDetails>
          <div style={{ width: "80px" }}>
            <Cover
              hover={false}
              gameId={game.id}
              coverUrl={game.coverUrl}
              stillCoverUrl={game.stillCoverUrl}
            />
          </div>
        </div>
        <CaveItemBigActions>
          <QuickAction type="button" onClick={this.onExplore}>
            <QuickActionIcon icon="folder-open" />
            <QuickActionLabel>
              <QuickActionTitle>{T(showInExplorerString())}</QuickActionTitle>
              <QuickActionSubtitle>
                {cave.installInfo.installFolder}
                {cave.installInfo.installedSize ? (
                  <>
                    {" · "}
                    {fileSize(cave.installInfo.installedSize)}
                  </>
                ) : null}
              </QuickActionSubtitle>
            </QuickActionLabel>
          </QuickAction>
          <QuickAction type="button" onClick={this.onUpdateCheck}>
            <QuickActionIcon icon="repeat" />
            <QuickActionLabel>
              <QuickActionTitle>
                {T(["grid.item.check_for_update"])}
              </QuickActionTitle>
            </QuickActionLabel>
          </QuickAction>

          {u && u.channelName !== "" ? (
            <QuickAction type="button" onClick={this.onSwitchVersion}>
              <QuickActionIcon icon="shuffle" />
              <QuickActionLabel>
                <QuickActionTitle>
                  {T(["grid.item.revert_to_version"])}
                </QuickActionTitle>
              </QuickActionLabel>
            </QuickAction>
          ) : null}
        </CaveItemBigActions>
        <CaveLaunchSettings caveId={cave.id} />
        <ModalButtons>
          {this.props.modal.widgetParams.fromManageGame ? (
            <Button icon="arrow-left" onClick={this.onBack}>
              {T(["prompt.action.back"])}
            </Button>
          ) : null}
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
        action: actions.checkForGameUpdate({
          caveId,
          suppressNotification: false,
        }),
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
