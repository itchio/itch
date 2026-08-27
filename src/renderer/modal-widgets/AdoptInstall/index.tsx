import { asError, getErrorStack } from "common/butlerd/errors";
import { lighten, transparentize } from "polished";
import { actions } from "common/actions";
import * as messages from "common/butlerd/messages";
import {
  Game,
  InstallLocationSummary,
  Platform,
  Upload,
} from "common/butlerd/messages";
import { formatError } from "common/format/errors";
import { formatUploadTitle } from "common/format/upload";
import { hookLogging } from "common/helpers/bridge";
import { recordingLogger } from "common/logger";
import { ModalWidgetProps } from "common/modals";
import { AdoptInstallParams, AdoptInstallResponse } from "common/modals/types";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import { Watcher } from "common/util/watcher";
import React from "react";
import { IntlShape } from "react-intl";
import Button from "renderer/basics/Button";
import Filler from "renderer/basics/Filler";
import Floater from "renderer/basics/Floater";
import Icon from "renderer/basics/Icon";
import Link from "renderer/basics/Link";
import { ModalButtons } from "renderer/basics/modal-styles";
import SimpleSelect from "renderer/basics/SimpleSelect";
import { electron, files } from "renderer/bridge";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
import { LoadingStateDiv } from "renderer/hocs/butlerCaller";
import { hook } from "renderer/hocs/hook";
import { injectIntl } from "renderer/hocs/injectIntl";
import { watchStore } from "renderer/hooks/useWatcher";
import { rendererLogger } from "renderer/logger";
import modals from "renderer/modals";
import UploadOptionComponent, {
  UploadOption,
} from "renderer/modal-widgets/PlanInstall/UploadOptionComponent";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import { FilterSpacer } from "renderer/pages/common/SortsAndFilters";
import store from "renderer/store";
import styled from "renderer/styles";
import { T, TString, _ } from "renderer/t";

const logger = rendererLogger.child("AdoptInstall");

const AdoptInstallDiv = styled(ModalWidgetDiv)`
  min-width: 640px;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const IntroDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 14px;
`;

const CoverImg = styled.img`
  width: 76px;
  height: 60px;
  object-fit: cover;
  flex-shrink: 0;
`;

const IntroText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;

  .title {
    font-size: ${(props) => props.theme.fontSizes.larger};
    font-weight: bold;
  }

  .explainer {
    color: ${(props) => props.theme.secondaryText};
    line-height: 1.4;
  }
`;

const DropZone = styled.div`
  border: 2px dashed ${(props) => props.theme.inputBorder};
  border-radius: 4px;
  background: ${(props) => props.theme.itemBackground};
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  transition: border-color 0.15s, background 0.15s;

  &.dragover {
    border-color: ${(props) => props.theme.accent};
    background: rgba(255, 255, 255, 0.04);
  }

  .drop-icon {
    font-size: 32px;
    color: ${(props) => props.theme.secondaryText};
  }

  .drop-hint {
    color: ${(props) => props.theme.secondaryText};
  }
`;

const RequirementDiv = styled.div`
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.theme.fontSizes.smaller};
  line-height: 1.5;

  code {
    font-family: monospace;
    color: ${(props) => props.theme.inputText};
  }
`;

const RequirementLink = styled(Link)`
  margin-left: 8px;
  font-size: ${(props) => props.theme.fontSizes.smaller};
`;

const FolderRow = styled.div`
  border: 1px solid ${(props) => props.theme.inputBorder};
  border-radius: 2px;
  background: ${(props) => props.theme.inputBackground};
  padding: 10px 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;

  &.invalid {
    border-color: ${(props) => transparentize(0.4, props.theme.error)};
  }

  .path {
    font-family: monospace;
    font-size: ${(props) => props.theme.fontSizes.small};
    color: ${(props) => props.theme.inputText};
    word-break: break-all;
  }

  .ok {
    color: ${(props) => props.theme.success};
  }

  .invalid-icon {
    color: ${(props) => props.theme.error};
  }
`;

const UploadQuestionDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ProblemBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 4px;
  background: ${(props) => transparentize(0.9, props.theme.error)};
  border: 1px solid ${(props) => transparentize(0.65, props.theme.error)};
  line-height: 1.45;

  .problem {
    color: ${(props) => lighten(0.1, props.theme.error)};
  }

  .fix {
    color: ${(props) => props.theme.secondaryText};

    code {
      font-family: monospace;
      font-size: ${(props) => props.theme.fontSizes.small};
      color: ${(props) => props.theme.inputText};
    }
  }
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
    margin-top: 2px;
    font-size: 110%;
  }
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

/** the folder butler stores pending downloads in, refused by Install.Adopt */
const ReservedFolderName = "downloads";

interface FolderMatch {
  location: InstallLocationSummary;
  /** folder name directly beneath the location */
  name: string;
}

class AdoptInstall extends React.PureComponent<Props, State> {
  private unwatch = () => {};

  constructor(props: Props, context: any) {
    super(props, context);
    const { game } = props.modal.widgetParams;
    this.state = {
      busy: true,
      adopting: false,
      dragHover: false,
      game,
      installLocations: [],
    };
  }

  subscribe(watcher: Watcher) {
    watcher.on(actions.installLocationsChanged, async () => {
      this.loadInstallLocations();
    });
  }

  override componentDidMount() {
    this.unwatch = watchStore(store, (watcher) => this.subscribe(watcher));
    this.loadInstallLocations();
    this.loadUploads();
  }

  override componentWillUnmount() {
    this.unwatch();
  }

  override render() {
    const { game } = this.state;
    const coverUrl = game.stillCoverUrl || game.coverUrl;

    return (
      <AdoptInstallDiv>
        <IntroDiv>
          {coverUrl ? <CoverImg src={coverUrl} /> : null}
          <IntroText>
            <div className="title">{T(_("adopt_install.title"))}</div>
            <div className="explainer">{T(_("adopt_install.intro"))}</div>
          </IntroText>
        </IntroDiv>
        {this.renderMain()}
        <ModalButtons>
          <Button onClick={this.onCancel}>{T(["prompt.action.cancel"])}</Button>
          <Filler />
          <Button
            disabled={!this.canAdopt()}
            icon="link"
            primary
            onClick={this.onAdopt}
          >
            {T(_("adopt_install.link_button"))}
          </Button>
        </ModalButtons>
      </AdoptInstallDiv>
    );
  }

  renderMain() {
    const { busy, adopting, pickedFolderPath } = this.state;

    if (busy || adopting) {
      return (
        <LoadingStateDiv>
          {adopting
            ? T(_("adopt_install.linking_folder"))
            : T(["sidebar.loading"])}
          <FilterSpacer />
          <Floater />
        </LoadingStateDiv>
      );
    }

    if (!pickedFolderPath) {
      return this.renderPickFolder();
    }
    return this.renderPickedFolder();
  }

  renderPickFolder() {
    const location = this.defaultLocation();
    return (
      <>
        <DropZone
          className={this.state.dragHover ? "dragover" : ""}
          onDragOver={this.onDragOver}
          onDragLeave={this.onDragLeave}
          onDrop={this.onDrop}
        >
          <Icon icon="folder-open" className="drop-icon" />
          <div className="drop-hint">{T(_("adopt_install.drop_hint"))}</div>
          <Button icon="folder-open" onClick={this.onChooseFolder}>
            {T(_("adopt_install.choose_folder"))}
          </Button>
        </DropZone>
        <RequirementDiv>
          {T(_("adopt_install.folder_requirement"))}{" "}
          {location ? <code>{location.path}</code> : null}
          <RequirementLink
            label={T(_("adopt_install.open_location"))}
            onClick={this.onBrowseLocation}
          />
        </RequirementDiv>
      </>
    );
  }

  renderPickedFolder() {
    const { pickedFolderPath, error, hasReceipt } = this.state;
    const match = this.matchFolder();
    const reserved = this.reservedFolder();
    const valid = !!match && !reserved && !hasReceipt;

    return (
      <>
        <FolderRow className={valid ? "" : "invalid"}>
          {valid ? (
            <Icon icon="folder-open" />
          ) : (
            <Icon icon="warning" className="invalid-icon" />
          )}
          <span className="path">{pickedFolderPath}</span>
          {valid ? <Icon icon="checkmark" className="ok" /> : null}
          <Filler />
          <Link
            label={T(_("adopt_install.change_folder"))}
            onClick={this.onChooseFolder}
          />
        </FolderRow>
        {valid
          ? error
            ? this.renderError()
            : this.renderConfirm()
          : this.renderProblem(reserved)}
      </>
    );
  }

  renderConfirm() {
    const { game, uploads, incompatibleUploads, pickedUploadId } = this.state;

    let uploadOptions: UploadOption[] = (uploads ?? []).map((u) =>
      this.uploadToOption(u)
    );
    for (const u of incompatibleUploads ?? []) {
      uploadOptions.push(this.uploadToOption(u, true));
    }
    const uploadValue = uploadOptions.find((o) => o.value === pickedUploadId);

    return (
      <>
        {uploadOptions.length > 1 ? (
          <UploadQuestionDiv>
            <div>{T(_("adopt_install.which_download"))}</div>
            <SimpleSelect
              onChange={this.onUploadChange}
              value={uploadValue}
              options={uploadOptions}
              OptionComponent={UploadOptionComponent}
            />
          </UploadQuestionDiv>
        ) : null}
        <CautionCallout>
          <Icon icon="warning" />
          <span>{T(_("adopt_install.caution", { title: game.title }))}</span>
        </CautionCallout>
      </>
    );
  }

  renderProblem(reserved: boolean) {
    const location = this.defaultLocation();
    if (reserved) {
      return (
        <ProblemBox>
          <div className="problem">{T(_("adopt_install.reserved_folder"))}</div>
        </ProblemBox>
      );
    }
    if (this.state.hasReceipt) {
      return (
        <ProblemBox>
          <div className="problem">
            {T(_("adopt_install.folder_has_receipt"))}
          </div>
          <div className="fix">
            {T(_("adopt_install.folder_has_receipt_hint"))}
          </div>
          <div>
            <Button
              icon="search"
              label={T(["preferences.scan_install_locations"])}
              onClick={this.onScanLocations}
            />
          </div>
        </ProblemBox>
      );
    }
    return (
      <ProblemBox>
        <div className="problem">
          {T(_("adopt_install.folder_outside_location"))}
        </div>
        {location ? (
          <div className="fix">
            {T(
              _("adopt_install.move_folder_hint", { location: location.path })
            )}
          </div>
        ) : null}
        <div>
          <Button
            icon="folder-open"
            label={T(_("adopt_install.browse_location"))}
            onClick={this.onBrowseLocation}
          />
        </div>
      </ProblemBox>
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
            log: log || "",
          },
          buttons: ["ok"],
        })
      )
    );
  };

  onUploadChange = (item: UploadOption) => {
    if (typeof item.value !== "number") {
      return;
    }
    this.setState({ pickedUploadId: item.value });
  };

  onDragOver = (ev: React.DragEvent) => {
    ev.preventDefault();
    if (!this.state.dragHover) {
      this.setState({ dragHover: true });
    }
  };

  onDragLeave = () => {
    this.setState({ dragHover: false });
  };

  onDrop = (ev: React.DragEvent) => {
    ev.preventDefault();
    this.setState({ dragHover: false });
    const file = ev.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    const path = electron.getPathForFile(file);
    if (path) {
      this.pickFolder(path);
    }
  };

  onChooseFolder = () => {
    doAsync(async () => {
      const { intl } = this.props;
      const location = this.defaultLocation();
      const filePaths = await electron.showOpenDialog({
        title: TString(intl, _("adopt_install.choose_folder_title")),
        properties: ["openDirectory"],
        defaultPath: location ? location.path : undefined,
      });
      if (!filePaths || filePaths.length === 0) {
        return;
      }
      this.pickFolder(filePaths[0]);
    });
  };

  pickFolder(pickedFolderPath: string) {
    this.setState({
      pickedFolderPath,
      error: undefined,
      hasReceipt: undefined,
    });
    doAsync(async () => {
      let hasReceipt = false;
      try {
        await files.readTextFile(`${pickedFolderPath}/.itch/receipt.json.gz`);
        hasReceipt = true;
      } catch (e) {
        // no receipt - the folder is adoptable
      }
      this.setState((state) =>
        state.pickedFolderPath === pickedFolderPath ? { hasReceipt } : null
      );
    });
  }

  onScanLocations = () => {
    const { wind, id } = this.props.modal;
    const { dispatch } = this.props;
    dispatch(
      actions.closeModal({
        wind,
        id,
        action: actions.scanInstallLocations({}),
      })
    );
  };

  onBrowseLocation = () => {
    const { dispatch } = this.props;
    const location = this.defaultLocation();
    if (location) {
      dispatch(actions.browseInstallLocation({ id: location.id }));
    }
  };

  onCancel = () => {
    this.close();
  };

  onAdopt = () => {
    const { pickedUploadId, game } = this.state;
    const match = this.matchFolder();
    if (!match || !pickedUploadId) {
      return;
    }

    this.setState({ adopting: true, error: undefined });
    doAsync(async () => {
      const { dispatch, profileId } = this.props;
      const recLogger = recordingLogger(logger);
      try {
        await rcall(
          messages.InstallAdopt,
          {
            gameId: game.id,
            uploadId: pickedUploadId,
            installLocationId: match.location.id,
            installFolderName: match.name,
            profileId: profileId ?? undefined,
          },
          [hookLogging(recLogger)]
        );
        this.close();
        dispatch(actions.newItemsImported({}));
        dispatch(
          actions.statusMessage({
            message: ["adopt_install.success", { title: game.title }],
          })
        );
      } catch (e) {
        logger.error(`While adopting folder: ${getErrorStack(e)}`);
        this.setState({
          adopting: false,
          error: asError(e),
          log: recLogger.getLog(),
        });
      }
    });
  };

  close() {
    const { wind, id } = this.props.modal;
    const { dispatch } = this.props;
    dispatch(actions.closeModal({ wind, id }));
  }

  canAdopt(): boolean {
    const { busy, adopting, pickedUploadId, hasReceipt } = this.state;
    return (
      !busy &&
      !adopting &&
      !!pickedUploadId &&
      // undefined means the receipt probe is still running
      hasReceipt === false &&
      !!this.matchFolder() &&
      !this.reservedFolder()
    );
  }

  defaultLocation(): InstallLocationSummary | undefined {
    const { installLocations } = this.state;
    const { defaultInstallLocation } = this.props;
    return (
      installLocations.find((il) => il.id === defaultInstallLocation) ??
      installLocations[0]
    );
  }

  /**
   * The install location the picked folder sits directly beneath, if any.
   * Recomputed against current locations so an outdated pick degrades to
   * the "outside a location" message instead of a butlerd error.
   */
  matchFolder(): FolderMatch | null {
    const path = this.state.pickedFolderPath;
    if (!path) {
      return null;
    }
    const split = splitFolderPath(path);
    if (!split) {
      return null;
    }
    const caseInsensitive = this.props.systemPlatform !== Platform.Linux;
    const parent = normalizeFolderPath(split.parent, caseInsensitive);
    for (const location of this.state.installLocations) {
      if (normalizeFolderPath(location.path, caseInsensitive) === parent) {
        return { location, name: split.name };
      }
    }
    return null;
  }

  reservedFolder(): boolean {
    const { pickedFolderPath } = this.state;
    if (!pickedFolderPath) {
      return false;
    }
    const split = splitFolderPath(pickedFolderPath);
    return !!split && split.name.toLowerCase() === ReservedFolderName;
  }

  uploadToOption(u: Upload, incompatible?: boolean): UploadOption {
    return {
      label: formatUploadTitle(u),
      value: u.id,
      upload: u,
      incompatible,
    };
  }

  loadInstallLocations() {
    doAsync(async () => {
      const { installLocations } = await rcall(
        messages.InstallLocationsList,
        {}
      );
      this.setState({ installLocations });
    });
  }

  loadUploads() {
    this.setState({ busy: true });

    doAsync(async () => {
      try {
        const { game } = this.state;
        const { profileId } = this.props;
        const res = await rcall(messages.InstallGetUploads, {
          gameId: game.id,
          profileId: profileId ?? undefined,
        });
        const uploads = res.uploads;
        const incompatibleUploads = res.incompatibleUploads ?? [];
        const requestedId = this.props.modal.widgetParams.uploadId;
        const all = [...uploads, ...incompatibleUploads];
        const pickedUploadId =
          (requestedId && all.find((u) => u.id === requestedId)?.id) ||
          (all.length > 0 ? all[0].id : undefined);
        this.setState({
          game: res.game,
          uploads,
          incompatibleUploads,
          pickedUploadId,
          busy: false,
        });
      } catch (e) {
        this.setState({
          busy: false,
          error: asError(e),
        });
      }
    });
  }
}

/** strip trailing separators and unify to forward slashes for comparison */
function normalizeFolderPath(p: string, caseInsensitive: boolean): string {
  let out = p.replace(/\\/g, "/");
  while (out.length > 1 && out.endsWith("/")) {
    out = out.slice(0, -1);
  }
  return caseInsensitive ? out.toLowerCase() : out;
}

function splitFolderPath(p: string): { parent: string; name: string } | null {
  const norm = normalizeFolderPath(p, false);
  const idx = norm.lastIndexOf("/");
  if (idx <= 0 || idx === norm.length - 1) {
    // filesystem root or a relative path: never adoptable
    return null;
  }
  return { parent: norm.slice(0, idx), name: norm.slice(idx + 1) };
}

interface Props
  extends ModalWidgetProps<AdoptInstallParams, AdoptInstallResponse> {
  defaultInstallLocation: string;
  /** null when no profile is logged in */
  profileId: number | null;
  systemPlatform: Platform;
  dispatch: Dispatch;

  intl: IntlShape;
}

interface State {
  busy: boolean;
  adopting: boolean;
  dragHover: boolean;
  /** seeded from widgetParams, refreshed by InstallGetUploads */
  game: Game;
  /** uploads compatible with the current platform */
  uploads?: Upload[];
  /** platform compatibility is advisory here - the user supplies the files */
  incompatibleUploads?: Upload[];
  installLocations: InstallLocationSummary[];
  error?: Error;
  log?: string;

  pickedUploadId?: number;
  pickedFolderPath?: string;
  /** undefined while the receipt probe for pickedFolderPath is in flight */
  hasReceipt?: boolean;
}

export default injectIntl(
  hook((map) => ({
    defaultInstallLocation: map((rs) => rs.preferences.defaultInstallLocation),
    profileId: map((rs) => (rs.profile.profile ? rs.profile.profile.id : null)),
    systemPlatform: map((rs) => rs.system.platform),
  }))(AdoptInstall)
);
