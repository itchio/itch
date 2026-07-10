import { actions } from "common/actions";
import {
  ClearBrowsingDataParams,
  ClearBrowsingDataResponse,
  ExploreJsonParams,
  ExploreJsonResponse,
  ManageCaveParams,
  ManageCaveResponse,
  ManageGameParams,
  ManageGameResponse,
  PlanInstallParams,
  PlanInstallResponse,
  PrereqsStateParams,
  PrereqsStateResponse,
  RecaptchaInputParams,
  RecaptchaInputResponse,
  SecretSettingsParams,
  SecretSettingsResponse,
  SendFeedbackParams,
  ShowErrorParams,
  ShowErrorResponse,
  SwitchVersionCaveParams,
  SwitchVersionCaveResponse,
  TwoFactorInputParams,
  TwoFactorInputResponse,
  PushBuildParams,
  PushBuildResponse,
  ConfirmQuitParams,
  ConfirmQuitResponse,
  ViewChangelogParams,
  ViewChangelogResponse,
} from "common/modals/types";
import { Action, Modal, ModalBase, ModalUpdate } from "common/types";
import uuid from "common/util/uuid";

interface TypedModalBase<Params> extends ModalBase {
  widgetParams: Params;
}

export interface TypedModal<Params, Response> extends Modal {
  widgetParams: Params;
  widget?: any;
  /** phantom type carrier, always undefined at runtime */
  __response?: Response;
  /** always assigned by make() */
  id: string;
}

interface TypedModalUpdateBase<Params> extends ModalUpdate {
  widgetParams: Partial<Params>;
}

export interface TypedModalUpdate<Params> extends TypedModalUpdateBase<Params> {
  /** phantom type carrier, always undefined at runtime */
  __params?: Params;
}

export type ModalWidgetSpec<Params, Response> = {
  params?: Params;
  response?: Response;
  key: string;
  action: (response: Response) => Action<any>;
  make: (base: TypedModalBase<Params>) => TypedModal<Params, Response>;
  update: (update: TypedModalUpdateBase<Params>) => TypedModalUpdate<Params>;
};

export type ModalWidgetProps<Params, Response> = {
  modal: TypedModal<Params, Response>;
  updatePayload: (response: Response) => void;
};

interface ModalWidgetFactories {
  [key: string]: (key: string) => ModalWidgetSpec<any, any>;
}

type WiredWidgets<T extends ModalWidgetFactories> = {
  [K in keyof T]: ReturnType<T[K]>;
};

function widget<Params, Response>(
  uuid: () => string
): (key: string) => ModalWidgetSpec<Params, Response> {
  return (key) => ({
    key,
    action: (payload) => actions.modalResponse(payload),
    make: (base) => {
      return {
        ...base,
        widget: key,
        __response: undefined,
        id: uuid(),
      };
    },
    update: (payload) => {
      return {
        ...payload,
        __params: undefined,
      };
    },
  });
}

function wireWidgets<T extends ModalWidgetFactories>(mws: T): WiredWidgets<T> {
  const res = {} as any;
  for (const k of Object.keys(mws)) {
    res[k] = mws[k](k);
  }
  return res as WiredWidgets<T>;
}

export const prepModals = (uuid: () => string) => {
  return wireWidgets({
    clearBrowsingData: widget<
      ClearBrowsingDataParams,
      ClearBrowsingDataResponse
    >(uuid),
    exploreJson: widget<ExploreJsonParams, ExploreJsonResponse>(uuid),
    manageGame: widget<ManageGameParams, ManageGameResponse>(uuid),
    manageCave: widget<ManageCaveParams, ManageCaveResponse>(uuid),
    planInstall: widget<PlanInstallParams, PlanInstallResponse>(uuid),
    prereqsState: widget<PrereqsStateParams, PrereqsStateResponse>(uuid),
    recaptchaInput: widget<RecaptchaInputParams, RecaptchaInputResponse>(uuid),
    switchVersionCave: widget<
      SwitchVersionCaveParams,
      SwitchVersionCaveResponse
    >(uuid),
    secretSettings: widget<SecretSettingsParams, SecretSettingsResponse>(uuid),
    showError: widget<ShowErrorParams, ShowErrorResponse>(uuid),
    twoFactorInput: widget<TwoFactorInputParams, TwoFactorInputResponse>(uuid),
    sendFeedback: widget<SendFeedbackParams, void>(uuid),
    pushBuild: widget<PushBuildParams, PushBuildResponse>(uuid),

    // dummy widgets

    pickUpload: widget<
      {},
      {
        /** manually picked upload for install */
        pickedUploadIndex?: number;
      }
    >(uuid),

    pickManifestAction: widget<
      {},
      {
        /** index of the manifest action that was picked when launching a game */
        index: number;
      }
    >(uuid),

    sandboxBlessing: widget<
      {},
      {
        /** whether or not to install the sandbox */
        sandboxBlessing?: boolean;
      }
    >(uuid),

    adminWipeBlessing: widget<{}, {}>(uuid),

    naked: widget<{} | null, {}>(uuid),

    confirmQuit: widget<ConfirmQuitParams, ConfirmQuitResponse>(uuid),

    viewChangelog: widget<ViewChangelogParams, ViewChangelogResponse>(uuid),
  });
};

export const modalShape = prepModals(() => "");
