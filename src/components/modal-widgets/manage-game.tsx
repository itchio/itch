import * as React from "react";

import { IModalWidgetProps, ModalWidgetDiv } from "./modal-widget";
import { Game, Upload } from "ts-itchio-api";
import { ICave } from "../../db/models/cave";

import IconButton from "../basics/icon-button";
import Button from "../basics/button";
import Filler from "../basics/filler";
import styled from "../styles";

import { map, find, filter } from "underscore";
import { fileSize } from "../../format/filesize";
import { connect } from "../connect";
import { createStructuredSelector } from "reselect";
import { IRootState } from "../../types/index";
import getGameStatus, { IGameStatus } from "../../helpers/get-game-status";
import GameStats from "../game-stats";
import PlatformIcons from "../basics/platform-icons";

import * as actions from "../../actions";
import { dispatcher } from "../../constants/action-types";

const CaveItemList = styled.div`margin: 8px 0;`;

const CaveItem = styled.div`
  margin: 12px 4px;
  padding: 4px;
  border: 1px solid ${props => props.theme.inputBorder};
  background: ${props => props.theme.meatBackground};
  border-radius: 2px;

  display: flex;
  flex-direction: row;
  align-items: center;

  .platform-icons {
    margin-left: 8px;
  }
`;

const CaveItemActions = styled.div`
  display: flex;
  flex-direction: row;
`;

const Title = styled.div`
  margin-left: 8px;
  font-weight: bold;
`;

const FileSize = styled.div`
  color: ${props => props.theme.secondaryText};
  margin-left: 8px;
`;

class ManageGame extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const params = this.props.modal.widgetParams as IManageGameParams;
    const { game, caves, allUploads } = params;
    const { gameStatuses } = this.props;

    const installedUploadIds = {};
    for (const cave of caves) {
      if (cave.upload) {
        installedUploadIds[cave.upload.id] = true;
      }
    }

    const uninstalledUploads = filter(
      allUploads,
      u => !installedUploadIds[u.id]
    );

    return (
      <ModalWidgetDiv>
        <p>The following items are installed: </p>

        <CaveItemList>
          {map(caves, (cave, i) => {
            const status = gameStatuses[i];
            const u = cave.upload;
            return (
              <CaveItem>
                <Title>{uploadTitle(u)}</Title>
                {cave.installedSize ? (
                  <FileSize>{fileSize(cave.installedSize)}</FileSize>
                ) : null}
                {u ? (
                  <PlatformIcons className="platform-icons" target={u} />
                ) : null}
                <Filler />
                <GameStats game={game} status={status} />
                <Filler />
                <CaveItemActions>
                  <IconButton
                    data-cave-id={cave.id}
                    hint="Re-install"
                    icon="repeat"
                    onClick={this.onReinstall}
                  />
                  <IconButton
                    data-cave-id={cave.id}
                    hint="Uninstall"
                    icon="uninstall"
                    onClick={this.onUninstall}
                  />
                </CaveItemActions>
              </CaveItem>
            );
          })}
        </CaveItemList>

        {uninstalledUploads.length > 0 ? (
          <p>You can also install these: </p>
        ) : null}
        {uninstalledUploads.length > 0 ? (
          <CaveItemList>
            {map(uninstalledUploads, u => {
              return (
                <CaveItem>
                  <Title>{uploadTitle(u)}</Title>
                  {u.size > 0 ? <FileSize>{fileSize(u.size)}</FileSize> : null}
                  <PlatformIcons className="platform-icons" target={u} />
                  <Filler />
                  <CaveItemActions>
                    <Button
                      data-upload-id={u.id}
                      icon="install"
                      discreet
                      primary
                      onClick={this.onInstall}
                    >
                      Install
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
    const params = this.props.modal.widgetParams as IManageGameParams;
    const { game, allUploads } = params;
    const upload = find(allUploads, { id: uploadId });
    this.props.closeModal({
      action: actions.queueGameInstall({ game, upload }),
    });
  };

  onUninstall = (ev: React.MouseEvent<HTMLElement>) => {
    const caveId = ev.currentTarget.dataset.caveId;
    this.props.closeModal({
      action: actions.queueCaveUninstall({ caveId }),
    });
  };

  onReinstall = (ev: React.MouseEvent<HTMLElement>) => {
    const caveId = ev.currentTarget.dataset.caveId;
    this.props.closeModal({
      action: actions.queueCaveReinstall({ caveId }),
    });
  };
}

function uploadTitle(u: Upload) {
  return u ? u.displayName || u.filename : "?";
}

export default connect<IProps>(ManageGame, {
  state: createStructuredSelector({
    gameStatuses: (rs: IRootState, props: IProps) => {
      const params = props.modal.widgetParams as IManageGameParams;
      const { caves, game } = params;
      return map(caves, cave => getGameStatus(rs, game, cave));
    },
  }),
  dispatch: dispatch => ({
    closeModal: dispatcher(dispatch, actions.closeModal),
  }),
});

export interface IManageGameParams {
  game: Game;
  caves: ICave[];
  allUploads: Upload[];
}

interface IProps extends IModalWidgetProps {}

interface IDerivedProps {
  gameStatuses: IGameStatus;

  closeModal: typeof actions.closeModal;
}
