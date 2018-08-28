import classNames from "classnames";
import { actions } from "common/actions";
import { messages } from "common/butlerd";
import {
  DownloadReason,
  Game,
  InstallLocationSummary,
  InstallPlanInfo,
  Upload,
} from "common/butlerd/messages";
import { fileSize } from "common/format/filesize";
import { formatUploadTitle } from "common/format/upload";
import { ModalWidgetProps } from "common/modals";
import { PlanInstallParams, PlanInstallResponse } from "common/modals/types";
import { Dispatch } from "common/types";
import React from "react";
import Button from "renderer/basics/Button";
import Filler from "renderer/basics/Filler";
import Icon from "renderer/basics/Icon";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { ModalButtons } from "renderer/basics/modal-styles";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
import { LoadingStateDiv } from "renderer/hocs/butlerCaller";
import { hook } from "renderer/hocs/hook";
import { rendererLogger } from "renderer/logger";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import { FilterSpacer } from "renderer/pages/common/SortsAndFilters";
import StandardGameDesc from "renderer/pages/common/StandardGameDesc";
import { Box, BoxInner } from "renderer/pages/PageStyles/boxes";
import { StandardGameCover } from "renderer/pages/PageStyles/games";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { findWhere } from "underscore";

const logger = rendererLogger.child(__filename);

const WideBox = styled(Box)`
  width: 100%;
`;

const SizeTable = styled.table`
  td {
    line-height: 2.5;
    padding-right: 0.4em;

    &.low {
      color: ${props => props.theme.error};
    }

    strong {
      font-weight: bold;
    }

    i {
      font-size: 80%;
      opacity: 0.6;
    }
  }
`;

const PlanInstallDiv = styled(ModalWidgetDiv)`
  min-width: 800px;
  max-width: 800px;
  min-height: 500px;
  max-height: 500px;
  display: flex;
  flex-direction: column;

  font-size: ${props => props.theme.fontSizes.larger};
`;

const SelectGroup = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;

  padding: 0.4em 0;
`;

const SelectHeader = styled.h3`
  width: 150px;
`;

const Select = styled.select`
  flex-grow: 1;
  padding: 0.4em;
  border: 1px solid ${props => props.theme.filterBorder};
  border-radius: 3px;
  color: ${props => props.theme.baseText};

  background: rgba(0, 0, 0, 0.1);
  font-size: ${props => props.theme.fontSizes.large};
`;

enum PlanStage {
  Planning,
}

class PlanInstall extends React.PureComponent<Props, State> {
  constructor(props: Props, context: any) {
    super(props, context);
    const { game } = props.modal.widgetParams;
    this.state = {
      stage: PlanStage.Planning,
      busy: true,
      game,
      gameId: game.id,
      installLocations: [],
    };
  }

  render() {
    return <PlanInstallDiv>{this.renderBody()}</PlanInstallDiv>;
  }

  renderBody() {
    const { stage } = this.state;
    switch (stage) {
      case PlanStage.Planning:
        return this.renderPlanning();
    }
  }

  renderPlanning() {
    const {
      game,
      uploads,
      pickedUploadId,
      installLocations,
      pickedInstallLocationId,
      busy,
      error,
    } = this.state;

    let canInstall = !error && !busy;
    return (
      <>
        <WideBox>
          <BoxInner>
            <StandardGameCover game={game} />
            <FilterSpacer />
            <StandardGameDesc game={game} />
            <FilterSpacer />
          </BoxInner>
        </WideBox>
        <SelectGroup>
          <SelectHeader>Install</SelectHeader>
          <Select onChange={this.onUploadChange} disabled={!uploads}>
            {uploads ? (
              uploads.map(u => (
                <option
                  key={u.id}
                  value={u.id}
                  selected={u.id === pickedUploadId}
                >
                  {formatUploadTitle(u)} ({fileSize(u.size)})
                </option>
              ))
            ) : (
              <option disabled>...</option>
            )}
          </Select>
        </SelectGroup>
        <SelectGroup>
          <SelectHeader>To location</SelectHeader>
          <Select onChange={this.onInstallLocationChange}>
            {installLocations.map(il => (
              <option
                key={il.id}
                value={il.id}
                selected={il.id === pickedInstallLocationId}
              >
                {il.path} ({fileSize(il.sizeInfo.freeSize)} free)
              </option>
            ))}
          </Select>
        </SelectGroup>

        <Filler />
        {busy
          ? this.renderBusy()
          : error
            ? this.renderError()
            : this.renderSizes()}
        <Filler />
        <ModalButtons>
          <Button onClick={this.onCancel}>{T(["prompt.action.cancel"])}</Button>
          <Filler />
          <Button
            disabled={!canInstall}
            icon="arrow-right"
            primary
            onClick={this.onInstall}
            id={canInstall ? "modal-install-now" : null}
          >
            {T(["grid.item.install"])}
          </Button>
        </ModalButtons>
      </>
    );
  }

  renderError() {
    const { error } = this.state;
    return <p>Something went wrong: {error.message}</p>;
  }

  renderBusy() {
    return (
      <LoadingStateDiv>
        <div>Computing space requirements...</div>
        <FilterSpacer />
        <LoadingCircle progress={-1} />
      </LoadingStateDiv>
    );
  }

  renderSizes() {
    const { info, pickedInstallLocationId, installLocations } = this.state;
    if (!info) {
      return null;
    }

    const installLocation = findWhere(installLocations, {
      id: pickedInstallLocationId,
    });
    if (!installLocation) {
      return null;
    }

    const requiredSpace = info ? info.diskUsage.neededFreeSpace : -1;
    const freeSpace = installLocation.sizeInfo.freeSize;
    const haveEnoughSpace = requiredSpace <= freeSpace;

    return (
      <SizeTable>
        <tr>
          <td>Disk space required</td>
          <td>
            <strong>{requiredSpace > 0 ? fileSize(requiredSpace) : "?"}</strong>
          </td>
        </tr>
        <tr>
          <td>Disk space available</td>
          <td className={classNames({ low: !haveEnoughSpace })}>
            <strong>{fileSize(freeSpace)}</strong>{" "}
            {haveEnoughSpace ? (
              <Icon icon="checkmark" />
            ) : (
              <Icon icon="warning" />
            )}
          </td>
        </tr>
      </SizeTable>
    );
  }

  onInstallLocationChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    const id = ev.currentTarget.value;
    this.setState({
      pickedInstallLocationId: id,
    });
  };

  onUploadChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(ev.currentTarget.value, 10);
    this.setState({
      pickedUploadId: id,
      busy: true,
    });
    this.pickUpload(id);
  };

  close() {
    const { wind, id } = this.props.modal;
    const { dispatch } = this.props;
    dispatch(actions.closeModal({ wind, id }));
  }

  onCancel = (ev: React.MouseEvent<HTMLElement>) => {
    this.close();
  };

  onInstall = (ev: React.MouseEvent<HTMLElement>) => {
    this.close();
    doAsync(async () => {
      const { game } = this.state;
      const { pickedInstallLocationId, pickedUploadId, uploads } = this.state;
      const upload = findWhere(uploads, { id: pickedUploadId });
      logger.info(`Queueing install for ${game.url}...`);
      await rcall(messages.InstallQueue, {
        reason: DownloadReason.Install,
        installLocationId: pickedInstallLocationId,
        game,
        upload,
        queueDownload: true,
      });
      logger.info(`Queued!`);
      const { dispatch } = this.props;
      dispatch(actions.downloadQueued({}));
    });
  };

  componentDidMount() {
    this.loadInstallLocations();
    const { uploadId } = this.props.modal.widgetParams;
    this.pickUpload(uploadId);
  }

  loadInstallLocations() {
    doAsync(async () => {
      const { defaultInstallLocation } = this.props;
      const { installLocations } = await rcall(
        messages.InstallLocationsList,
        {}
      );
      this.setState({
        stage: PlanStage.Planning,
        installLocations,
        pickedInstallLocationId: defaultInstallLocation,
      });
    });
  }

  pickUpload(uploadId: number) {
    doAsync(async () => {
      try {
        const { gameId } = this.state;
        const res = await rcall(messages.InstallPlan, { gameId, uploadId });
        this.setState({
          stage: PlanStage.Planning,
          game: res.game,
          uploads: res.uploads,
          pickedUploadId: res.info ? res.info.upload.id : null,
          info: res.info,
          busy: false,
          error: null,
        });
      } catch (e) {
        this.setState({
          busy: false,
          error: e,
        });
      }
    });
  }
}

interface Props
  extends ModalWidgetProps<PlanInstallParams, PlanInstallResponse> {
  defaultInstallLocation: string;
  dispatch: Dispatch;
}

interface State {
  stage: PlanStage;
  busy: boolean;
  gameId: number;
  game?: Game;
  uploads?: Upload[];
  info?: InstallPlanInfo;
  error?: Error;
  installLocations: InstallLocationSummary[];

  pickedUploadId?: number;
  pickedInstallLocationId?: string;
}

export default hook(map => ({
  defaultInstallLocation: map(rs => rs.preferences.defaultInstallLocation),
}))(PlanInstall);
