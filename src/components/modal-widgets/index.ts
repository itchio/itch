import * as React from "react";
import ManageGame, { IManageGameParams } from "./manage-game";
import ExploreJson, {
  IExploreJsonParams,
  IExploreJsonResponse,
} from "./explore-json";
import SecretSettings, { ISecretSettingsParams } from "./secret-settings";
import ShowError, { IShowErrorParams } from "./show-error";
import RevertCave, {
  IRevertCaveParams,
  IRevertCaveResponse,
} from "./revert-cave";
import RecaptchaInput, {
  IRecaptchaInputParams,
  IRecaptchaInputResponse,
} from "./recaptcha-input";
import TwoFactorInput, {
  ITwoFactorInputParams,
  ITwoFactorInputResponse,
} from "./two-factor-input";
import PrereqsState, { IPrereqsStateParams } from "./prereqs-state";
import ClearBrowsingData, {
  IClearBrowsingDataParams,
  IClearBrowsingDataResponse,
} from "./clear-browsing-data";
import {
  ModalResponse,
  IAction,
  IModalBase,
  IModalUpdate,
  IModal,
} from "../../types/index";
import { actions } from "../../actions/index";

export interface ITypedModalBase<Params> extends IModalBase {
  widgetParams: Params;
}

export interface ITypedModal<Params, Response> extends IModal {
  widgetParams: Params;
  widget?: any;
  __response: Response;
}

export interface ITypedModalUpdateBase<Params> extends IModalUpdate {
  widgetParams: Partial<Params>;
}

export interface ITypedModalUpdate<Params>
  extends ITypedModalUpdateBase<Params> {
  __params: Params;
}

export type ModalWidgetSpec<Params, Response> = {
  params?: Params;
  response?: Response;
  key: string;
  component: typeof React.PureComponent;
  action: (response: Response) => IAction<ModalResponse>;
  make: (base: ITypedModalBase<Params>) => ITypedModal<Params, Response>;
  update: (update: ITypedModalUpdateBase<Params>) => ITypedModalUpdate<Params>;
};

export type IModalWidgetProps<Params, Response> = {
  modal: ITypedModal<Params, Response>;
  updatePayload: (response: Response) => void;
};

interface IModalWidgets {
  [key: string]: ModalWidgetSpec<any, any>;
}

function widget<Params, Response>(
  component
): ModalWidgetSpec<Params, Response> {
  let spec: ModalWidgetSpec<Params, Response>;
  spec = {
    key: null,
    component,
    action: payload => actions.modalResponse(payload),
    make: base => {
      return {
        ...base,
        widget: spec.key,
        __response: undefined,
      };
    },
    update: payload => {
      return {
        ...payload,
        __params: undefined,
      };
    },
  };
  return spec;
}

function wireWidgets<T extends IModalWidgets>(mws: T): T {
  for (const k of Object.keys(mws)) {
    mws[k].key = k;
  }
  return mws;
}

export const modalWidgets = wireWidgets({
  clearBrowsingData: widget<
    IClearBrowsingDataParams,
    IClearBrowsingDataResponse
  >(ClearBrowsingData),

  exploreJson: widget<IExploreJsonParams, IExploreJsonResponse>(ExploreJson),

  manageGame: widget<IManageGameParams, void>(ManageGame),
  prereqsState: widget<IPrereqsStateParams, void>(PrereqsState),
  recaptchaInput: widget<IRecaptchaInputParams, IRecaptchaInputResponse>(
    RecaptchaInput
  ),
  revertCave: widget<IRevertCaveParams, IRevertCaveResponse>(RevertCave),
  secretSettings: widget<ISecretSettingsParams, void>(SecretSettings),
  showError: widget<IShowErrorParams, void>(ShowError),
  twoFactorInput: widget<ITwoFactorInputParams, ITwoFactorInputResponse>(
    TwoFactorInput
  ),

  // dummy widgets

  pickUpload: widget<
    {},
    {
      /** manually picked upload for install */
      pickedUploadIndex?: number;
    }
  >(null),

  pickManifestAction: widget<
    {},
    {
      /** which manifest action was picked when launching a game */
      manifestActionName?: string;
    }
  >(null),

  sandboxBlessing: widget<
    {},
    {
      /** whether or not to install the sandbox */
      sandboxBlessing?: boolean;
    }
  >(null),

  adminWipeBlessing: widget<{}, {}>(null),

  naked: widget<null, void>(null),
});
