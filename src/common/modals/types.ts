import {
  Game,
  PrereqStatus,
  Cave,
  Upload,
  Build,
} from "common/butlerd/messages";

export interface TwoFactorInputParams {
  username: string;
}

export interface TwoFactorInputResponse {
  /** two-factor authentication code entered */
  totpCode?: string;
}

//---------------------

export interface ShowErrorParams {
  rawError: any;
  game?: Game;
  log: string;
  forceDetails?: boolean;
  showSendReport?: boolean;
}

export interface ShowErrorResponse {
  sendReport: boolean;
}

//---------------------

export interface SecretSettingsParams {}
export interface SecretSettingsResponse {}

//---------------------

export interface SendFeedbackParams {
  log?: string;
}

export interface SendFeedbackResponse {}

//---------------------

export interface RecaptchaInputParams {
  url: string;
}

export interface RecaptchaInputResponse {
  recaptchaResponse: string;
}

//---------------------

export interface PrereqsStateParams {
  gameTitle: string;
  tasks: {
    [prereqName: string]: TaskProgressState;
  };
}

interface TaskProgressState {
  order: number;
  fullName: string;
  status: PrereqStatus;
  progress: number;
  eta: number;
  bps: number;
}

export interface PrereqsStateResponse {}

//---------------------

export interface ManageGameParams {
  game: Game;
  caves: Cave[];
  allUploads: Upload[];
  loadingUploads: boolean;
}

export interface ManageGameResponse {}

//---------------------

export interface ManageCaveParams {
  cave: Cave;
}

export interface ManageCaveResponse {}

//---------------------

export interface PlanInstallParams {
  uploadId?: number;
  game: Game;
}

export interface PlanInstallResponse {}

//---------------------

export interface ExploreJsonParams {
  data: any;
}

export interface ExploreJsonResponse {}

//---------------------

export interface SwitchVersionCaveParams {
  cave: Cave;
  upload: Upload;
  builds: Build[];
}

export interface SwitchVersionCaveResponse {
  /** index of build to revert to (or negative to abort) */
  index?: number;
}

//---------------------

export interface ClearBrowsingDataParams {}
export interface ClearBrowsingDataResponse {
  /** whether to clear cookies */
  cookies?: boolean;

  /** whether to clear cache */
  cache?: boolean;
}

//---------------------

export interface ConfirmQuitParams {
  gameIds: number[];
}
export interface ConfirmQuitResponse {}
