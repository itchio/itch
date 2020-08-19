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

function widget<Params, Response>(): ModalWidgetSpec<Params, Response> {
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

export const modals = wireWidgets({
  clearBrowsingData: widget<
    ClearBrowsingDataParams,
    ClearBrowsingDataResponse
  >(),
  exploreJson: widget<ExploreJsonParams, ExploreJsonResponse>(),
  manageGame: widget<ManageGameParams, ManageGameResponse>(),
  manageCave: widget<ManageCaveParams, ManageCaveResponse>(),
  planInstall: widget<PlanInstallParams, PlanInstallResponse>(),
  prereqsState: widget<PrereqsStateParams, PrereqsStateResponse>(),
  recaptchaInput: widget<RecaptchaInputParams, RecaptchaInputResponse>(),
  switchVersionCave: widget<
    SwitchVersionCaveParams,
    SwitchVersionCaveResponse
  >(),
  secretSettings: widget<SecretSettingsParams, SecretSettingsResponse>(),
  showError: widget<ShowErrorParams, ShowErrorResponse>(),
  twoFactorInput: widget<TwoFactorInputParams, TwoFactorInputResponse>(),
  sendFeedback: widget<SendFeedbackParams, void>(),

  // dummy widgets

  pickUpload: widget<
    {},
    {
      /** manually picked upload for install */
      pickedUploadIndex?: number;
    }
  >(),

  pickManifestAction: widget<
    {},
    {
      /** index of the manifest action that was picked when launching a game */
      index: number;
    }
  >(),

  sandboxBlessing: widget<
    {},
    {
      /** whether or not to install the sandbox */
      sandboxBlessing?: boolean;
    }
  >(),

  adminWipeBlessing: widget<{}, {}>(),

  naked: widget<{}, {}>(),

  confirmQuit: widget<ConfirmQuitParams, ConfirmQuitResponse>(),
});
