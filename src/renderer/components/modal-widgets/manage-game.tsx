import React from "react";

import { ModalWidgetDiv } from "./modal-widget";
import { Game, Upload, Cave } from "common/butlerd/messages";

import UploadIcon from "../basics/upload-icon";
import Button from "../basics/button";
import Filler from "../basics/filler";
import styled from "../styles";

import { map, find, filter, each, size } from "underscore";
import { fileSize } from "common/format/filesize";
import { connect, Dispatchers, actionCreatorsList } from "../connect";

import { actions } from "common/actions";
import { T } from "renderer/t";
import LoadingCircle from "../basics/loading-circle";
import { formatUploadTitle } from "common/format/upload";
import TotalPlaytime from "../total-playtime";
import LastPlayed from "../last-played";
import { IModalWidgetProps } from "./index";
import { getCaveSummary } from "common/butlerd";
import { rendererWindow } from "common/util/navigation";

const CaveItemList = styled.div`
  margin: 8px 0;
`;

const CaveItem = styled.div`
  margin: 12px 4px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: ${props => props.theme.itemBackground};
  border-radius: 2px;

  display: flex;
  flex-direction: row;
  align-items: center;
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

class ManageGame extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const params = this.props.modal.widgetParams;
    const { game, caves, allUploads, loadingUploads } = params;

    const installedUploadIds: { [key: number]: boolean } = {};
    each(caves, cave => {
      if (cave.upload) {
        installedUploadIds[cave.upload.id] = true;
      }
    });

    const uninstalledUploads = filter(
      allUploads,
      u => !installedUploadIds[u.id]
    );

    return (
      <ModalWidgetDiv>
        {size(caves) > 0 ? (
          <>
            <p>{T(["prompt.manage_game.installed_uploads"])}</p>

            <CaveItemList>
              {map(caves, (cave, i) => {
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
                          <FileSize>
                            {fileSize(cave.installInfo.installedSize)}
                          </FileSize>
                        ) : null}
                        <Spacer />
                        <LastPlayed game={game} cave={caveSummary} />
                        <Spacer />
                        <TotalPlaytime game={game} cave={caveSummary} />
                      </CaveDetailsRow>
                    </CaveDetails>
                    <Filler />
                    <CaveItemActions>
                      <Button
                        className="manage-cave"
                        data-cave-id={cave.id}
                        icon="cog"
                        discreet
                        primary
                        onClick={this.onManage}
                      >
                        {T(["grid.item.manage"])}
                      </Button>
                    </CaveItemActions>
                  </CaveItem>
                );
              })}
            </CaveItemList>
          </>
        ) : null}

        {uninstalledUploads.length > 0 ? (
          size(caves) > 0 ? (
            <p>{T(["prompt.manage_game.available_uploads"])}</p>
          ) : null
        ) : (
          <p>
            {loadingUploads ? (
              <LoadingCircle progress={0} />
            ) : (
              T(["prompt.manage_game.no_other_uploads"])
            )}
          </p>
        )}
        {uninstalledUploads.length > 0 ? (
          <CaveItemList>
            {map(uninstalledUploads, u => {
              return (
                <CaveItem>
                  <CaveDetails>
                    <CaveDetailsRow>
                      <Title>{formatUpload(u)}</Title>
                    </CaveDetailsRow>
                    <CaveDetailsRow className="smaller">
                      {u.size > 0 ? (
                        <FileSize>{fileSize(u.size)}</FileSize>
                      ) : null}
                    </CaveDetailsRow>
                  </CaveDetails>
                  <Filler />
                  <CaveItemActions>
                    <Button
                      data-upload-id={u.id}
                      icon="install"
                      discreet
                      primary
                      onClick={this.onInstall}
                    >
                      {T(["grid.item.install"])}
                    </Button>
                  </CaveItemActions>
                </CaveItem>
              );
            })}
          </CaveItemList>
        ) : null}
      </ModalWidgetDiv>
    );
  }

  onInstall = (ev: React.MouseEvent<HTMLElement>) => {
    const uploadId = parseInt(ev.currentTarget.dataset.uploadId, 10);
    const params = this.props.modal.widgetParams;
    const { game, allUploads } = params;
    const upload = find(allUploads, { id: uploadId });
    this.props.closeModal({
      window: rendererWindow(),
      action: actions.queueGameInstall({ game, upload }),
    });
  };

  onManage = (ev: React.MouseEvent<HTMLElement>) => {
    const caveId = ev.currentTarget.dataset.caveId;
    this.props.closeModal({
      window: rendererWindow(),
      action: actions.manageCave({ caveId }),
    });
  };
}

export interface IManageGameParams {
  game: Game;
  caves: Cave[];
  allUploads: Upload[];
  loadingUploads: boolean;
}

interface IProps extends IModalWidgetProps<IManageGameParams, void> {}

const actionCreators = actionCreatorsList(
  "closeModal",
  "exploreCave",
  "manageCave"
);

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(ManageGame, { actionCreators });

function formatUpload(upload: Upload): JSX.Element {
  return (
    <>
      <UploadIcon upload={upload} />
      <Spacer />
      {formatUploadTitle(upload)}
    </>
  );
}
