import { actions } from "common/actions";
import { getCaveSummary } from "common/butlerd";
import { Upload } from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { formatUploadTitle } from "common/format/upload";
import { ManageGameParams, ManageGameResponse } from "common/modals/types";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import Button from "renderer/basics/Button";
import Filler from "renderer/basics/Filler";
import LastPlayed from "renderer/basics/LastPlayed";
import LoadingCircle from "renderer/basics/LoadingCircle";
import TotalPlaytime from "renderer/basics/TotalPlaytime";
import UploadIcon from "renderer/basics/UploadIcon";
import { hook } from "renderer/hocs/hook";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { each, filter, find, map, size } from "underscore";
import { ModalWidgetProps } from "common/modals";
import Floater from "renderer/basics/Floater";

const CaveItemList = styled.div`
  margin: 8px 0;
`;

const CaveItem = styled.div`
  margin: 12px 4px;
  padding: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: ${(props) => props.theme.itemBackground};
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
  margin-right: 8px;
`;

const Title = styled.div`
  margin-left: 8px;
  font-weight: bold;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

const FileSize = styled.div`
  color: ${(props) => props.theme.secondaryText};
  margin-left: 8px;
`;

const ManageGameDiv = styled(ModalWidgetDiv)`
  min-width: 600px;
  min-height: 300px;
`;

class ManageGame extends React.PureComponent<Props> {
  render() {
    const params = this.props.modal.widgetParams;
    const { game, caves, allUploads, loadingUploads } = params;

    const installedUploadIds: { [key: number]: boolean } = {};
    each(caves, (cave) => {
      if (cave.upload) {
        installedUploadIds[cave.upload.id] = true;
      }
    });

    const uninstalledUploads = filter(
      allUploads,
      (u) => !installedUploadIds[u.id]
    );

    return (
      <ManageGameDiv>
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
          <>
            {" "}
            {loadingUploads ? (
              <Floater />
            ) : (
              <p>{T(["prompt.manage_game.no_other_uploads"])}</p>
            )}
          </>
        )}
        {uninstalledUploads.length > 0 ? (
          <CaveItemList>
            {map(uninstalledUploads, (u) => {
              return (
                <CaveItem key={u.id}>
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
      </ManageGameDiv>
    );
  }

  onInstall = (ev: React.MouseEvent<HTMLElement>) => {
    const uploadId = parseInt(ev.currentTarget.dataset.uploadId, 10);
    const params = this.props.modal.widgetParams;
    const { game } = params;
    const { dispatch } = this.props;
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        action: actions.queueGameInstall({ game, uploadId }),
      })
    );
  };

  onManage = (ev: React.MouseEvent<HTMLElement>) => {
    const caveId = ev.currentTarget.dataset.caveId;
    const { dispatch } = this.props;
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        action: actions.manageCave({ caveId }),
      })
    );
  };
}

interface Props extends ModalWidgetProps<ManageGameParams, ManageGameResponse> {
  dispatch: Dispatch;
}

export default hook()(ManageGame);

function formatUpload(upload: Upload): JSX.Element {
  return (
    <>
      <UploadIcon upload={upload} />
      <Spacer />
      {formatUploadTitle(upload)}
    </>
  );
}
