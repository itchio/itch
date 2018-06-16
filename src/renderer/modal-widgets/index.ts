import { actions } from "common/actions/index";
import {
  IAction,
  IModal,
  IModalBase,
  IModalUpdate,
  ModalResponse,
} from "common/types";
import uuid from "common/util/uuid";
import React from "react";
import ClearBrowsingData, {
  IClearBrowsingDataParams,
  IClearBrowsingDataResponse,
} from "./ClearBrowsingData";
import ExploreJson, {
  IExploreJsonParams,
  IExploreJsonResponse,
} from "./ExploreJson";
import ManageCave, { IManageCaveParams } from "./ManageCave";
import ManageGame, { IManageGameParams } from "./ManageGame";
import PrereqsState, { IPrereqsStateParams } from "./PrereqsState";
import RecaptchaInput, {
  IRecaptchaInputParams,
  IRecaptchaInputResponse,
} from "./RecaptchaInput";
import ScanInstallLocations, {
  IScanInstallLocationsParams,
  IScanInstallLocationsResponse,
} from "./ScanInstallLocations";
import SecretSettings, { ISecretSettingsParams } from "./SecretSettings";
import ShowError, { IShowErrorParams } from "./ShowError";
import SwitchVersionCave, {
  ISwitchCaveResponse,
  ISwitchVersionCaveParams,
} from "./SwitchVersionCave";
import TwoFactorInput, {
  ITwoFactorInputParams,
  ITwoFactorInputResponse,
} from "./TwoFactorInput";

interface ITypedModalBase<Params> extends IModalBase {
  widgetParams: Params;
}

export interface ITypedModal<Params, Response> extends IModal {
  widgetParams: Params;
  widget?: any;
  __response: Response;
}

interface ITypedModalUpdateBase<Params> extends IModalUpdate {
  widgetParams: Partial<Params>;
}

export interface ITypedModalUpdate<Params>
  extends ITypedModalUpdateBase<Params> {
  __params: Params;
}

type ModalWidgetSpec<Params, Response> = {
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
        id: uuid(),
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
  manageCave: widget<IManageCaveParams, void>(ManageCave),
  prereqsState: widget<IPrereqsStateParams, void>(PrereqsState),
  recaptchaInput: widget<IRecaptchaInputParams, IRecaptchaInputResponse>(
    RecaptchaInput
  ),
  switchVersionCave: widget<ISwitchVersionCaveParams, ISwitchCaveResponse>(
    SwitchVersionCave
  ),
  secretSettings: widget<ISecretSettingsParams, void>(SecretSettings),
  showError: widget<IShowErrorParams, void>(ShowError),
  twoFactorInput: widget<ITwoFactorInputParams, ITwoFactorInputResponse>(
    TwoFactorInput
  ),
  scanInstallLocations: widget<
    IScanInstallLocationsParams,
    IScanInstallLocationsResponse
  >(ScanInstallLocations),

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
      /** index of the manifest action that was picked when launching a game */
      index: number;
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
