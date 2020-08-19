import classNames from "classnames";
import { actions } from "common/actions";
import { hookLogging, messages } from "common/butlerd";
import {
  DownloadReason,
  Game,
  InstallLocationSummary,
  InstallPlanInfo,
  Upload,
} from "common/butlerd/messages";
import { formatError, getInstallPlanInfoError } from "common/format/errors";
import { fileSize } from "common/format/filesize";
import { formatUploadTitle } from "common/format/upload";
import { modals, ModalWidgetProps } from "common/modals";
import { PlanInstallParams, PlanInstallResponse } from "common/modals/types";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import { IntlShape, injectIntl } from "react-intl";
import Button from "renderer/basics/Button";
import Filler from "renderer/basics/Filler";
import Floater from "renderer/basics/Floater";
import Icon from "renderer/basics/Icon";
import { ModalButtons } from "renderer/basics/modal-styles";
import SimpleSelect from "renderer/basics/SimpleSelect";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
import { LoadingStateDiv } from "renderer/hocs/butlerCaller";
import { hook } from "renderer/hocs/hook";
import watching, { Watcher } from "renderer/hocs/watching";
import { rendererLogger } from "renderer/logger";
import InstallLocationOptionComponent, {
  InstallLocationOption,
  InstallLocationOptionAdd,
} from "renderer/modal-widgets/PlanInstall/InstallLocationOptionComponent";
import UploadOptionComponent, {
  UploadOption,
} from "renderer/modal-widgets/PlanInstall/UploadOptionComponent";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import { FilterSpacer } from "renderer/pages/common/SortsAndFilters";
import StandardGameCover from "renderer/pages/common/StandardGameCover";
import StandardGameDesc from "renderer/pages/common/StandardGameDesc";
import { Box, BoxInner } from "renderer/pages/PageStyles/boxes";
import styled from "renderer/styles";
import { T, TString, _ } from "renderer/t";
import { findWhere } from "underscore";
import { recordingLogger } from "common/logger";

const logger = rendererLogger.child(__filename);

const DiskSpaceIcon = styled(Icon)`
  margin-left: 8px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ErrorButtons = styled.div`
  flex-shrink: 0;
`;

const ErrorParagraph = styled.div`
  flex-grow: 1;
  line-height: 1.4;
  margin-right: 1em;
  color: ${(props) => props.theme.error};
  font-size: ${(props) => props.theme.fontSizes.baseText};
`;

const WideBox = styled(Box)`
  width: 100%;
`;

const SizeTable = styled.table`
  td {
    line-height: 2.5;
    padding-right: 0.4em;

    &.low {
      color: ${(props) => props.theme.error};
    }

    &.desc {
      color: ${(props) => props.theme.secondaryText};
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

const StyledSelect = styled.select`
  flex-grow: 1;
  padding: 0.4em;
  border: 1px solid ${(props) => props.theme.filterBorder};
  border-radius: 3px;
  color: ${(props) => props.theme.baseText};

  background: rgba(0, 0, 0, 0.1);
  font-size: ${(props) => props.theme.fontSizes.large};
`;

enum PlanStage {
  Planning,
}

@watching
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

  subscribe(watcher: Watcher) {
    watcher.on(actions.installLocationsChanged, async () => {
      this.loadInstallLocations();
    });
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
    let locationOptions = installLocations.map((il) => {
      let val: InstallLocationOption = {
        label: `${il.path} (${fileSize(il.sizeInfo.freeSize)} free)`,
        value: il.id,
        location: il,
      };
      return val;
    });
    locationOptions.push({
      label: _("preferences.install_location.add"),
      value: InstallLocationOptionAdd,
      location: null,
    });
    let locationValue = findWhere(locationOptions, {
      value: pickedInstallLocationId,
    });

    let uploadOptions = [];
    if (uploads) {
      uploadOptions = uploads.map((u) => {
        let val: UploadOption = {
          label: `${formatUploadTitle(u)} ${
            u.size > 0 ? fileSize(u.size) : ""
          }`,
          value: u.id,
          upload: u,
        };
        return val;
      });
    }
    let uploadValue = findWhere(uploadOptions, { value: pickedUploadId });

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
          <SelectHeader>{T(_("plan_install.select_upload"))}</SelectHeader>
          <SimpleSelect
            onChange={this.onUploadChange}
            value={uploadValue}
            options={uploadOptions}
            OptionComponent={UploadOptionComponent}
            isLoading={busy}
          />
        </SelectGroup>
        <SelectGroup>
          <SelectHeader>
            {T(_("plan_install.select_install_location"))}
          </SelectHeader>
          <SimpleSelect
            onChange={this.onInstallLocationChange}
            value={locationValue}
            options={locationOptions}
            OptionComponent={InstallLocationOptionComponent}
          />
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
            icon="install"
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
    return (
      <ErrorContainer>
        <ErrorParagraph>
          <Icon icon="error" /> {T(formatError(error))}
        </ErrorParagraph>
        <ErrorButtons>
          <Button
            label={T(["grid.item.view_details"])}
            onClick={this.onShowError}
          />
        </ErrorButtons>
      </ErrorContainer>
    );
  }

  onShowError = () => {
    const { dispatch, intl } = this.props;
    const { game, error, log } = this.state;
    dispatch(
      actions.openModal(
        modals.showError.make({
          wind: ambientWind(),
          title: ["prompt.install_error.title"],
          message: TString(intl, formatError(error)),
          widgetParams: {
            game,
            rawError: error,
            log,
          },
          buttons: ["ok"],
        })
      )
    );
  };

  renderBusy() {
    return (
      <LoadingStateDiv>
        {T(_("plan_install.computing_space_requirements"))}
        <FilterSpacer />
        <Floater />
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
        <tbody>
          <tr>
            <td className="desc">{T(_("plan_install.disk_space_required"))}</td>
            <td>
              <strong>
                {requiredSpace > 0 ? fileSize(requiredSpace) : "?"}
              </strong>
            </td>
          </tr>
          <tr>
            <td className="desc">
              {T(_("plan_install.disk_space_available"))}
            </td>
            <td className={classNames({ low: !haveEnoughSpace })}>
              <strong>{fileSize(freeSpace)}</strong>
              {haveEnoughSpace ? (
                <DiskSpaceIcon icon="checkmark" />
              ) : (
                <DiskSpaceIcon icon="warning" />
              )}
            </td>
          </tr>
        </tbody>
      </SizeTable>
    );
  }

  onInstallLocationChange = (item: InstallLocationOption) => {
    if (item.value === InstallLocationOptionAdd) {
      const { dispatch } = this.props;
      dispatch(actions.addInstallLocation({ wind: ambientWind() }));
      return;
    }

    this.setState({
      pickedInstallLocationId: item.value,
    });
    const { dispatch } = this.props;
    dispatch(
      actions.updatePreferences({
        defaultInstallLocation: item.value,
      })
    );
  };

  onUploadChange = (item: UploadOption) => {
    const id = item.value;
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
      const { dispatch } = this.props;
      const { game } = this.state;
      const { pickedInstallLocationId, pickedUploadId, uploads } = this.state;
      const upload = findWhere(uploads, { id: pickedUploadId });
      const logger = recordingLogger(rendererLogger);
      logger.info(`Queuing install for ${game.url}...`);
      try {
        await rcall(
          messages.InstallQueue,
          {
            reason: DownloadReason.Install,
            installLocationId: pickedInstallLocationId,
            game,
            upload,
            build: upload.build,
            queueDownload: true,
            fastQueue: true,
          },
          (convo) => {
            hookLogging(convo, logger);
          }
        );
        logger.info(`Queued!`);
        dispatch(actions.downloadQueued({}));
      } catch (e) {
        logger.error(`While queuing download: ${e.stack}`);
        const { intl } = this.props;
        dispatch(
          actions.openModal(
            modals.showError.make({
              wind: ambientWind(),
              title: ["prompt.install_error.title"],
              message: TString(intl, formatError(e)),
              widgetParams: {
                game,
                rawError: e,
                log: logger.getLog(),
              },
              buttons: ["ok"],
            })
          )
        );
      }
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

      const defaultRecord = findWhere(installLocations, {
        id: defaultInstallLocation,
      });
      this.setState({
        stage: PlanStage.Planning,
        installLocations,
        pickedInstallLocationId: defaultRecord
          ? defaultRecord.id
          : installLocations[0].id,
      });
    });
  }

  pickUpload(uploadId: number) {
    doAsync(async () => {
      try {
        const { gameId } = this.state;
        const logger = recordingLogger(rendererLogger);
        const res = await rcall(
          messages.InstallPlan,
          { gameId, uploadId },
          (convo) => {
            hookLogging(convo, logger);
          }
        );
        this.setState({
          stage: PlanStage.Planning,
          game: res.game,
          uploads: res.uploads,
          pickedUploadId: res.info ? res.info.upload.id : null,
          info: res.info,
          busy: false,
          error:
            res.info && res.info.error
              ? getInstallPlanInfoError(res.info)
              : null,
          log: logger.getLog(),
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

  intl: IntlShape;
}

interface State {
  stage: PlanStage;
  busy: boolean;
  gameId: number;
  game?: Game;
  uploads?: Upload[];
  info?: InstallPlanInfo;
  error?: Error;
  log?: string;
  installLocations: InstallLocationSummary[];

  pickedUploadId?: number;
  pickedInstallLocationId?: string;
}

export default injectIntl(
  hook((map) => ({
    defaultInstallLocation: map((rs) => rs.preferences.defaultInstallLocation),
  }))(PlanInstall)
);
