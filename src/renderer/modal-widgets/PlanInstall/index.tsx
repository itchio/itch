import { asError, getErrorStack } from "common/butlerd/errors";
import classNames from "classnames";
import { lighten, transparentize } from "polished";
import { v4 as uuid } from "uuid";
import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import {
  DownloadReason,
  Game,
  InstallLocationSummary,
  InstallPlanInfo,
  Platform,
  Upload,
  InstallGetUploads,
  InstallPlanUpload,
} from "common/butlerd/messages";
import { formatError, getInstallPlanInfoError } from "common/format/errors";
import { fileSize } from "common/format/filesize";
import { formatPlatform } from "common/format/platform";
import { formatUploadTitle, uploadPlatformList } from "common/format/upload";
import { ModalWidgetProps } from "common/modals";
import modals from "renderer/modals";
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
import { hookLogging } from "common/helpers/bridge";

const logger = rendererLogger.child("PlanInstall");

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

const NoCompatibleParagraph = styled.div`
  flex-grow: 1;
  line-height: 1.4;
  margin-right: 1em;
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.baseText};
`;

const CautionCallout = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 4px;
  background: ${(props) => transparentize(0.88, props.theme.caution)};
  border: 1px solid ${(props) => transparentize(0.65, props.theme.caution)};
  color: ${(props) => props.theme.baseText};
  line-height: 1.45;

  .icon {
    color: ${(props) => lighten(0.08, props.theme.caution)};
    /* Nudge the icon to sit on the cap line of the first text line. */
    margin-top: 2px;
    font-size: 110%;
  }
`;

/** pseudo-option value for the "Other downloads" group header */
const OtherDownloadsHeader = "header:other-downloads";
/** pseudo-option value for the "show all downloads" reveal affordance */
const ShowIncompatibleAction = "action:show-incompatible";

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

  override render() {
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
      incompatibleUploads,
      showingIncompatible,
      pickedUploadId,
      installLocations,
      pickedInstallLocationId,
      busy,
      infoBusy,
      error,
    } = this.state;

    // install requires the picked upload to actually resolve - a stale or
    // invalid pickedUploadId must not enable the button
    let pickedUpload = findWhere(this.allUploads(), { id: pickedUploadId });
    let pickedIsIncompatible =
      !!pickedUpload && !findWhere(uploads ?? [], { id: pickedUploadId });
    let canInstall = !error && !busy && !!pickedUpload;
    let locationOptions = installLocations.map((il) => {
      let label = il.sizeInfo
        ? `${il.path} (${fileSize(il.sizeInfo.freeSize)} free)`
        : il.path;
      let val: InstallLocationOption = {
        label,
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

    const incompatible = incompatibleUploads ?? [];
    const hasIncompatible = incompatible.length > 0;
    const compatibleCount = uploads?.length ?? 0;

    let uploadOptions: UploadOption[] = (uploads ?? []).map((u) =>
      this.uploadToOption(u)
    );
    if (showingIncompatible && hasIncompatible) {
      // only label the group when there are compatible uploads above it
      if (compatibleCount > 0) {
        uploadOptions.push({
          value: OtherDownloadsHeader,
          label: _("plan_install.other_downloads"),
          isHeader: true,
        });
      }
      for (const u of incompatible) {
        uploadOptions.push(this.uploadToOption(u, true));
      }
    } else if (hasIncompatible) {
      // a game with only incompatible uploads auto-reveals them, so this
      // affordance only appears when compatible uploads exist above it
      uploadOptions.push({
        value: ShowIncompatibleAction,
        label: _("plan_install.show_all_downloads"),
        isAction: true,
        onSelect: this.onShowIncompatible,
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
          : this.renderMain(pickedUpload, pickedIsIncompatible)}
        <Filler />
        <ModalButtons>
          <Button onClick={this.onCancel}>{T(["prompt.action.cancel"])}</Button>
          <Filler />
          <Button
            disabled={!canInstall}
            icon="install"
            primary={!pickedIsIncompatible}
            onClick={this.onInstall}
            id={canInstall ? "modal-install-now" : undefined}
          >
            {pickedIsIncompatible
              ? T(_("plan_install.install_anyway"))
              : T(["grid.item.install"])}
          </Button>
        </ModalButtons>
      </>
    );
  }

  renderMain(pickedUpload: Upload | undefined, pickedIsIncompatible: boolean) {
    const { uploads, incompatibleUploads, infoBusy } = this.state;

    const noCompatible = uploads && uploads.length == 0;
    const hasIncompatible = (incompatibleUploads?.length ?? 0) > 0;
    if (noCompatible && !hasIncompatible) {
      return this.renderNoBuilds();
    }
    if (noCompatible && !pickedUpload) {
      return this.renderNoCompatible();
    }
    return (
      <>
        {pickedIsIncompatible && pickedUpload
          ? this.renderIncompatibleWarning(pickedUpload)
          : null}
        {infoBusy ? this.renderInfoBusy() : this.renderSizes()}
      </>
    );
  }

  renderNoCompatible() {
    // the "show all downloads" affordance lives in the upload dropdown itself
    return (
      <NoCompatibleParagraph>
        {T(
          _("plan_install.no_compatible_downloads", {
            platform: formatPlatform(this.props.systemPlatform),
          })
        )}
      </NoCompatibleParagraph>
    );
  }

  renderIncompatibleWarning(upload: Upload) {
    const { systemPlatform } = this.props;
    return (
      <CautionCallout>
        <Icon icon="warning" />
        <span>{T(this.incompatibleWarning(upload))}</span>
      </CautionCallout>
    );
  }

  // an upload can be filtered out for reasons other than platform (wrong
  // architecture, or an installer format we don't handle), so only claim
  // "it's for another platform" when its tags actually say so
  incompatibleWarning(upload: Upload) {
    const platform = formatPlatform(this.props.systemPlatform);
    const title = formatUploadTitle(upload);
    const uploadPlatforms = uploadPlatformList(upload);

    if (uploadPlatforms.length === 0) {
      return _("plan_install.untagged_warning", { title, platform });
    }
    if (uploadPlatforms.includes(this.props.systemPlatform)) {
      // tagged for this platform but still filtered (arch/format)
      return _("plan_install.system_incompatible_warning", { title });
    }
    return _("plan_install.incompatible_warning", {
      title,
      platform,
      uploadPlatforms: uploadPlatforms.map(formatPlatform).join(", "),
    });
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
            log: log || "",
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

  renderInfoBusy() {
    return (
      <LoadingStateDiv>
        {T(_("plan_install.computing_space_requirements"))}
        <FilterSpacer />
        <Floater />
      </LoadingStateDiv>
    );
  }

  renderNoBuilds() {
    return (
      <ErrorContainer>
        <ErrorParagraph>
          <Icon icon="error" /> {T(_("plan_install.no_available_downloads"))}
        </ErrorParagraph>
      </ErrorContainer>
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

    // diskUsage is only absent when planning failed, in which case we render
    // the error branch instead of this one
    const requiredSpace = info.diskUsage ? info.diskUsage.neededFreeSpace : -1;
    const freeSpace = installLocation.sizeInfo
      ? installLocation.sizeInfo.freeSize
      : -1;
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
              <strong>{freeSpace >= 0 ? fileSize(freeSpace) : "?"}</strong>
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
    if (typeof id !== "number") {
      // group headers aren't selectable, but let's be safe
      return;
    }
    this.setState({
      pickedUploadId: id,
    });
    this.loadPlanInfo(id);
  };

  onShowIncompatible = () => {
    this.setState({ showingIncompatible: true });
  };

  /** compatible + incompatible uploads, in display order */
  allUploads(): Upload[] {
    const { uploads, incompatibleUploads } = this.state;
    return [...(uploads ?? []), ...(incompatibleUploads ?? [])];
  }

  uploadToOption(u: Upload, incompatible?: boolean): UploadOption {
    return {
      label: `${formatUploadTitle(u)} ${u.size > 0 ? fileSize(u.size) : ""}`,
      value: u.id,
      upload: u,
      incompatible,
    };
  }

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
      const { dispatch, profileId } = this.props;
      const { game } = this.state;
      const { pickedInstallLocationId, pickedUploadId } = this.state;
      const upload = findWhere(this.allUploads(), { id: pickedUploadId });
      if (!upload) {
        // canInstall prevents this, but the modal is already closed by the
        // time we get here
        rendererLogger.warn(
          `No upload matching ${pickedUploadId}, not queuing install`
        );
        return;
      }
      const logger = recordingLogger(rendererLogger);
      logger.info(`Queuing install for ${game.url}...`);
      try {
        // investigate
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
            // scopes bundle ownership materialization to the active profile
            // (null when logged out; omitted on the wire, butler falls back)
            profileId: profileId ?? undefined,
          },
          [hookLogging(logger)]
        );
        logger.info(`Queued!`);
        dispatch(actions.downloadQueued({}));
      } catch (e) {
        logger.error(`While queuing download: ${getErrorStack(e)}`);
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

  override componentDidMount() {
    this.loadInstallLocations();
    const { uploadId } = this.props.modal.widgetParams;
    this.loadUploads(uploadId);
  }

  override componentWillUnmount() {
    const { planRequestId } = this.state;
    if (planRequestId) {
      rcall(messages.InstallCancel, { id: planRequestId }).catch(() => {
        // Ignore errors - request may have already completed
      });
    }
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

  loadUploads(uploadId?: number) {
    this.setState({ busy: true });

    doAsync(async () => {
      try {
        const { gameId } = this.state;
        const { profileId } = this.props;
        // profileId scopes bundle ownership materialization to the active
        // profile (this endpoint has install intent)
        const res = await rcall(InstallGetUploads, {
          gameId,
          profileId: profileId ?? undefined,
        });
        // defensive: older butlers don't return this field
        const incompatibleUploads = res.incompatibleUploads ?? [];
        // when a game has *only* incompatible uploads there's nothing to
        // gate behind a reveal - show them directly (the notice and the
        // per-upload warnings already make the situation obvious)
        const onlyIncompatible =
          res.uploads.length === 0 && incompatibleUploads.length > 0;
        // never auto-pick an incompatible upload: installing one should
        // always be a deliberate choice
        const pickedUploadId =
          uploadId || (res.uploads.length > 0 ? res.uploads[0].id : undefined);
        const showingIncompatible =
          this.state.showingIncompatible ||
          onlyIncompatible ||
          // if the caller pre-picked an upload that butler classified as
          // incompatible, reveal the group so the pick is actually visible
          (!!uploadId &&
            !findWhere(res.uploads, { id: uploadId }) &&
            !!findWhere(incompatibleUploads, { id: uploadId }));
        this.setState({
          stage: PlanStage.Planning,
          game: res.game,
          uploads: res.uploads,
          incompatibleUploads,
          showingIncompatible,
          pickedUploadId,
          busy: false,
        });
        if (pickedUploadId) {
          this.loadPlanInfo(pickedUploadId);
        }
      } catch (e) {
        this.setState({
          busy: false,
          error: asError(e),
        });
      }
    });
  }

  loadPlanInfo(uploadId: number) {
    // Cancel any in-flight PlanUpload request
    const { planRequestId } = this.state;
    if (planRequestId) {
      rcall(messages.InstallCancel, { id: planRequestId }).catch(() => {});
    }

    const requestId = uuid();
    this.setState({
      planRequestId: requestId,
      infoBusy: true,
      info: undefined,
      error: undefined,
    });

    doAsync(async () => {
      try {
        const logger = recordingLogger(rendererLogger);
        const res = await rcall(
          InstallPlanUpload,
          { uploadId, id: requestId },
          [hookLogging(logger)]
        );
        this.setState({
          info: res.info,
          infoBusy: false,
          error:
            res.info && res.info.error
              ? getInstallPlanInfoError(res.info) ?? undefined
              : undefined,
          log: logger.getLog(),
        });
      } catch (e) {
        this.setState({
          infoBusy: false,
          error: asError(e),
        });
      }
    });
  }
}

interface Props
  extends ModalWidgetProps<PlanInstallParams, PlanInstallResponse> {
  defaultInstallLocation: string;
  /** null when no profile is logged in */
  profileId: number | null;
  systemPlatform: Platform;
  dispatch: Dispatch;

  intl: IntlShape;
}

interface State {
  stage: PlanStage;
  busy: boolean;
  infoBusy?: boolean;
  gameId: number;
  /** always set: seeded from widgetParams in the constructor */
  game: Game;
  /** uploads compatible with the current platform */
  uploads?: Upload[];
  /** uploads butler filtered out for this platform (untagged or other-platform) */
  incompatibleUploads?: Upload[];
  /** true once the user has revealed the incompatible group */
  showingIncompatible?: boolean;
  info?: InstallPlanInfo;
  error?: Error;
  log?: string;
  installLocations: InstallLocationSummary[];

  pickedUploadId?: number;
  pickedInstallLocationId?: string;
  planRequestId?: string;
}

export default injectIntl(
  hook((map) => ({
    defaultInstallLocation: map((rs) => rs.preferences.defaultInstallLocation),
    profileId: map((rs) => (rs.profile.profile ? rs.profile.profile.id : null)),
    systemPlatform: map((rs) => rs.system.platform),
  }))(PlanInstall)
);
