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

const CaveItem = styled.div`
  padding: 4px;

  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const CaveDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const CaveDetailsRow = styled.div`
  padding: 6px 0;

  display: flex;
  flex-direction: row;
  align-items: center;

  .platform-icons {
    margin-left: 8px;
  }

  &.smaller {
    font-size: 90%;
  }
`;

const Spacer = styled.div`
  height: 1px;
  width: 8px;
`;

const CaveItemActions = styled.div`
  display: flex;
  flex-direction: row;
  margin-top: 10px;

  & > * {
    margin-right: 4px;
  }
`;

const Title = styled.div`
  margin-left: 8px;
  font-weight: bold;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

const FileSize = styled.div`
  color: ${props => props.theme.secondaryText};
  margin-left: 8px;
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
        <CaveDetails>
          <CaveDetailsRow>
            <Title>{formatUpload(u)}</Title>
          </CaveDetailsRow>
          <CaveDetailsRow className="smaller">
            {cave.installInfo.installedSize ? (
              <FileSize>{fileSize(cave.installInfo.installedSize)}</FileSize>
            ) : null}
            <Spacer />
            <LastPlayed game={game} cave={caveSummary} />
            <Spacer />
            <TotalPlaytime game={game} cave={caveSummary} />
          </CaveDetailsRow>
        </CaveDetails>
        <CaveItemActions>
          <Button icon="folder-open" onClick={this.onExplore}>
            {T(showInExplorerString())}
          </Button>
          <Button icon="shuffle" onClick={this.onSwitchVersion}>
            {T(["grid.item.revert_to_version"])}
          </Button>
          <Button
            icon="repeat"
            onClick={this.onReinstall}
            className="manage-reinstall"
          >
            {T(["prompt.uninstall.reinstall"])}
          </Button>
          <Button
            hint={[]}
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
