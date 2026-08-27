import { ModalWidgetProps } from "common/modals";
import modals from "renderer/modals";

import ClearBrowsingData from "renderer/modal-widgets/ClearBrowsingData";
import SwitchVersionCave from "renderer/modal-widgets/SwitchVersionCave";
import ExploreJson from "renderer/modal-widgets/ExploreJson";
import ManageCave from "renderer/modal-widgets/ManageCave";
import ManageGame from "renderer/modal-widgets/ManageGame";
import AdoptInstall from "renderer/modal-widgets/AdoptInstall";
import PlanInstall from "renderer/modal-widgets/PlanInstall";
import PrereqsState from "renderer/modal-widgets/PrereqsState";
import PushBuild from "renderer/modal-widgets/PushBuild";
import SendFeedback from "renderer/modal-widgets/SendFeedback";
import SecretSettings from "renderer/modal-widgets/SecretSettings";
import SteamShortcuts from "renderer/modal-widgets/SteamShortcuts";
import ShowError from "renderer/modal-widgets/ShowError";
import TwoFactorInput from "renderer/modal-widgets/TwoFactorInput";
import ConfirmQuit from "renderer/modal-widgets/ConfirmQuit";
import ViewChangelog from "renderer/modal-widgets/ViewChangelog";

type ModalRegistry = typeof modals;

type ModalWidgetRegistry = {
  [K in keyof ModalRegistry]: React.ComponentType<
    ModalWidgetProps<ModalRegistry[K]["params"], ModalRegistry[K]["response"]> &
      any
  > | null;
} & {
  [key: string]: React.ComponentType<any> | null;
};

export const modalWidgets: ModalWidgetRegistry = {
  clearBrowsingData: ClearBrowsingData,
  switchVersionCave: SwitchVersionCave,
  exploreJson: ExploreJson,
  manageCave: ManageCave,
  manageGame: ManageGame,
  planInstall: PlanInstall,
  adoptInstall: AdoptInstall,
  prereqsState: PrereqsState,
  pushBuild: PushBuild,
  sendFeedback: SendFeedback,
  secretSettings: SecretSettings,
  steamShortcuts: SteamShortcuts,
  showError: ShowError,
  twoFactorInput: TwoFactorInput,
  confirmQuit: ConfirmQuit,
  viewChangelog: ViewChangelog,

  // dummies
  pickManifestAction: null,
  sandboxBlessing: null,
  naked: null,
};
