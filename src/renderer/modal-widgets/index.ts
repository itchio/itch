import { actions } from "common/actions/index";
import {
  Action,
  Modal,
  ModalBase,
  ModalUpdate,
  ModalResponse,
} from "common/types";
import uuid from "common/util/uuid";
import React from "react";
import ClearBrowsingData, {
  ClearBrowsingDataParams,
  ClearBrowsingDataResponse,
} from "./ClearBrowsingData";
import ExploreJson, {
  ExploreJsonParams,
  ExploreJsonResponse,
} from "./ExploreJson";
import ManageCave, { ManageCaveParams } from "./ManageCave";
import ManageGame, { ManageGameParams } from "./ManageGame";
import PrereqsState, { PrereqsStateParams } from "./PrereqsState";
import RecaptchaInput, {
  RecaptchaInputParams,
  RecaptchaInputResponse,
} from "./RecaptchaInput";
import ScanInstallLocations, {
  ScanInstallLocationsParams,
  ScanInstallLocationsResponse,
} from "./ScanInstallLocations";
import SecretSettings, { SecretSettingsParams } from "./SecretSettings";
import ShowError, { ShowErrorParams } from "./ShowError";
import SwitchVersionCave, {
  SwitchCaveResponse,
  SwitchVersionCaveParams,
} from "./SwitchVersionCave";
import TwoFactorInput, {
  TwoFactorInputParams,
  TwoFactorInputResponse,
} from "./TwoFactorInput";
import ReportIssue, {
  ReportIssueParams,
} from "renderer/modal-widgets/ReportIssue";

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

type ModalWidgetSpec<Params, Response> = {
  params?: Params;
  response?: Response;
  key: string;
  component: typeof React.PureComponent;
  action: (response: Response) => Action<ModalResponse>;
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

function wireWidgets<T extends ModalWidgets>(mws: T): T {
  for (const k of Object.keys(mws)) {
    mws[k].key = k;
  }
  return mws;
}

export const modalWidgets = wireWidgets({
  clearBrowsingData: widget<ClearBrowsingDataParams, ClearBrowsingDataResponse>(
    ClearBrowsingData
  ),

  exploreJson: widget<ExploreJsonParams, ExploreJsonResponse>(ExploreJson),

  manageGame: widget<ManageGameParams, void>(ManageGame),
  manageCave: widget<ManageCaveParams, void>(ManageCave),
  prereqsState: widget<PrereqsStateParams, void>(PrereqsState),
  recaptchaInput: widget<RecaptchaInputParams, RecaptchaInputResponse>(
    RecaptchaInput
  ),
  switchVersionCave: widget<SwitchVersionCaveParams, SwitchCaveResponse>(
    SwitchVersionCave
  ),
  secretSettings: widget<SecretSettingsParams, void>(SecretSettings),
  showError: widget<ShowErrorParams, void>(ShowError),
  twoFactorInput: widget<TwoFactorInputParams, TwoFactorInputResponse>(
    TwoFactorInput
  ),
  scanInstallLocations: widget<
    ScanInstallLocationsParams,
    ScanInstallLocationsResponse
  >(ScanInstallLocations),
  reportIssue: widget<ReportIssueParams, void>(ReportIssue),

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
