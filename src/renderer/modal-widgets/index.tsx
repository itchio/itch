import { modals, ModalWidgetProps } from "common/modals";
import ClearBrowsingData from "renderer/modal-widgets/ClearBrowsingData";
import SwitchVersionCave from "renderer/modal-widgets/SwitchVersionCave";
import ExploreJson from "renderer/modal-widgets/ExploreJson";
import ManageCave from "renderer/modal-widgets/ManageCave";
import ManageGame from "renderer/modal-widgets/ManageGame";
import PrereqsState from "renderer/modal-widgets/PrereqsState";
import RecaptchaInput from "renderer/modal-widgets/RecaptchaInput";
import ReportIssue from "renderer/modal-widgets/ReportIssue";
import ScanInstallLocations from "renderer/modal-widgets/ScanInstallLocations";
import SecretSettings from "renderer/modal-widgets/SecretSettings";
import ShowError from "renderer/modal-widgets/ShowError";
import TwoFactorInput from "renderer/modal-widgets/TwoFactorInput";

type ModalRegistry = typeof modals;

type ModalWidgetRegistry = {
  [K in keyof ModalRegistry]: React.ComponentType<
    ModalWidgetProps<ModalRegistry[K]["params"], ModalRegistry[K]["response"]> &
      any
  >
} & {
  [key: string]: React.ComponentType<any>;
};

export const modalWidgets: ModalWidgetRegistry = {
  clearBrowsingData: ClearBrowsingData,
  switchVersionCave: SwitchVersionCave,
  exploreJson: ExploreJson,
  manageCave: ManageCave,
  manageGame: ManageGame,
  prereqsState: PrereqsState,
  recaptchaInput: RecaptchaInput,
  reportIssue: ReportIssue,
  scanInstallLocations: ScanInstallLocations,
  secretSettings: SecretSettings,
  showError: ShowError,
  twoFactorInput: TwoFactorInput,

  // dummies
  adminWipeBlessing: null,
  pickManifestAction: null,
  pickUpload: null,
  sandboxBlessing: null,
  naked: null,
};
