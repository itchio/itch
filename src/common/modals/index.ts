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
  ConfirmQuitParams,
  ConfirmQuitResponse,
} from "common/modals/types";
import { Action, Modal, ModalBase, ModalUpdate } from "common/types";
import uuid from "common/util/uuid";

interface TypedModalBase<Params> extends ModalBase {
  widgetParams: Params;
}

export interface TypedModal<Params, Response> extends Modal {
  widgetParams: Params;
  widget?: any;
  __response: Response;
}

interface TypedModalUpdateBase<Params> extends ModalUpdate {
  widgetParams: Partial<Params>;
}

export interface TypedModalUpdate<Params> extends TypedModalUpdateBase<Params> {
  __params: Params;
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

interface ModalWidgets {
  [key: string]: ModalWidgetSpec<any, any>;
}

function widget<Params, Response>(
  uuid: () => string
): ModalWidgetSpec<Params, Response> {
  let spec: ModalWidgetSpec<Params, Response>;
  spec = {
    key: null,
    action: (payload) => actions.modalResponse(payload),
    make: (base) => {
      return {
        ...base,
        widget: spec.key,
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
  };
  return spec;
}

function wireWidgets<T extends ModalWidgets>(mws: T): T {
  for (const k of Object.keys(mws)) {
    mws[k].key = k;
  }
  return mws;
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

    naked: widget<{}, {}>(uuid),

    confirmQuit: widget<ConfirmQuitParams, ConfirmQuitResponse>(uuid),
  });
};

export const modalShape = prepModals(() => "");
