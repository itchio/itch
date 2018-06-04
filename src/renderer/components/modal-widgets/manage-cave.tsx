import React from "react";

import { ModalWidgetDiv } from "./modal-widget";
import { Upload, Cave } from "common/butlerd/messages";

import UploadIcon from "../basics/upload-icon";
import Button from "../basics/button";
import styled from "../styles";

import { fileSize } from "common/format/filesize";
import { connect, Dispatchers, actionCreatorsList } from "../connect";

import { actions } from "common/actions";
import { T } from "renderer/t";
import { formatUploadTitle } from "common/format/upload";
import { showInExplorerString } from "common/format/show-in-explorer";
import TotalPlaytime from "../total-playtime";
import LastPlayed from "../last-played";
import { IModalWidgetProps } from "./index";
import { getCaveSummary } from "common/butlerd";
import RowButton, {
  BigButtonContent,
  BigButtonRow,
  Tag,
} from "../basics/row-button";

import Cover from "../basics/cover";
import TimeAgo from "../basics/time-ago";
import Icon from "../basics/icon";

const CaveItem = styled.div`
  padding: 4px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  .time-ago,
  .total-playtime {
    color: ${props => props.theme.secondaryText} !important;
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

const CaveItemActions = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  width: 100%;
  margin-top: 10px;

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

class ManageCave extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    return <ModalWidgetDiv>{this.renderCave()}</ModalWidgetDiv>;
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
            <CaveDetailsRow className="smaller">
              <Icon icon="tag" />
              <Spacer />
              Published
              <Spacer />
              <TimeAgo date={u.createdAt} />
              <SpacerLarge />
              <Icon icon="install" />
              <Spacer />
              Installed
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

          {u.channelName == "" ? (
            ""
          ) : (
            <RowButton icon="shuffle" onClick={this.onSwitchVersion}>
              {T(["grid.item.revert_to_version"])}
            </RowButton>
          )}
        </CaveItemBigActions>
        <CaveItemActions>
          <Button
            discreet
            icon="repeat"
            onClick={this.onReinstall}
            className="manage-reinstall"
          >
            {T(["prompt.uninstall.reinstall"])}
          </Button>
          <Button
            discreet
            icon="uninstall"
            onClick={this.onUninstall}
            className="manage-uninstall"
          >
            {T(["prompt.uninstall.uninstall"])}
          </Button>
        </CaveItemActions>
      </CaveItem>
    );
  }

  onSwitchVersion = (ev: React.MouseEvent<HTMLElement>) => {
    const cave = this.props.modal.widgetParams.cave;
    this.props.closeModal({
      action: actions.switchVersionCaveRequest({ cave }),
    });
  };

  onUninstall = (ev: React.MouseEvent<HTMLElement>) => {
    const caveId = this.props.modal.widgetParams.cave.id;
    this.props.closeModal({
      action: actions.queueCaveUninstall({ caveId }),
    });
  };

  onReinstall = (ev: React.MouseEvent<HTMLElement>) => {
    const caveId = this.props.modal.widgetParams.cave.id;
    this.props.closeModal({
      action: actions.queueCaveReinstall({ caveId }),
    });
  };

  onExplore = (ev: React.MouseEvent<HTMLElement>) => {
    const caveId = this.props.modal.widgetParams.cave.id;
    this.props.exploreCave({ caveId });
  };
}

export interface IManageCaveParams {
  cave: Cave;
}

interface IProps extends IModalWidgetProps<IManageCaveParams, void> {}

const actionCreators = actionCreatorsList(
  "closeModal",
  "exploreCave",
  "manageCave"
);

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(ManageCave, { actionCreators });

function formatUpload(upload: Upload): JSX.Element {
  return (
    <>
      <UploadIcon upload={upload} />
      <Spacer />
      {formatUploadTitle(upload)}
    </>
  );
}
