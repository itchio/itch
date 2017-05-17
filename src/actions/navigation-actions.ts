
import { createAction } from "redux-actions";
import { userToTabData, gameToTabData, collectionToTabData } from "../util/navigation";

import { IUserRecord, ICollectionRecord } from "../types";
import GameModel from "../models/game";

import * as uuid from "uuid";

import {
  NAVIGATE, INavigatePayload,
  OPEN_TAB, IOpenTabPayload,
  FOCUS_NTH_TAB, IFocusNthTabPayload,
  MOVE_TAB, IMoveTabPayload,
  EVOLVE_TAB, IEvolveTabPayload,
  TAB_EVOLVED, ITabEvolvedPayload,
  NEW_TAB, INewTabPayload,
  CLOSE_TAB, ICloseTabPayload,
  CLOSE_ALL_TABS, ICloseAllTabsPayload,
  SHOW_PREVIOUS_TAB, IShowPreviousTabPayload,
  SHOW_NEXT_TAB, IShowNextTabPayload,
  SWITCH_PAGE, ISwitchPagePayload,

  TAB_RELOADED, ITabReloadedPayload,
  TAB_CHANGED, ITabChangedPayload,
  TABS_CHANGED, ITabsChangedPayload,
  TABS_RESTORED, ITabsRestoredPayload,
  TAB_DATA_FETCHED, ITabDataFetchedPayload,

  OPEN_TAB_CONTEXT_MENU, IOpenTabContextMenuPayload,
  OPEN_GAME_CONTEXT_MENU, IOpenGameContextMenuPayload,
  UNLOCK_TAB, IUnlockTabPayload,

  OPEN_URL, IOpenUrlPayload,
  REPORT_ISSUE, IReportIssuePayload,
  COPY_TO_CLIPBOARD, ICopyToClipboardPayload,
  HANDLE_ITCHIO_URL, IHandleItchioUrlPayload,
  TRIGGER_MAIN_ACTION, ITriggerMainActionPayload,
  TRIGGER_OK, ITriggerOkPayload,
  TRIGGER_BACK, ITriggerBackPayload,
  TRIGGER_LOCATION, ITriggerLocationPayload,

  VIEW_CREATOR_PROFILE, IViewCreatorProfilePayload,
  VIEW_COMMUNITY_PROFILE, IViewCommunityProfilePayload,

  TAB_LOADING, ITabLoadingPayload,

  TAB_PARAMS_CHANGED, ITabParamsChangedPayload,
} from "../constants/action-types";

const internalNavigate = createAction<INavigatePayload, any>(NAVIGATE);
export const navigate = (id: any, data = {}, background = false) => {
  if (typeof id === "object") {
    return internalNavigate(id);
  } else {
    return internalNavigate({ id, data, background });
  }
};

const internalOpenTab = createAction<IOpenTabPayload>(OPEN_TAB);
export const openTab = (payload: IOpenTabPayload) => {
  return internalOpenTab({...payload, tabId: uuid.v4()});
}
export const focusNthTab = createAction<IFocusNthTabPayload>(FOCUS_NTH_TAB);

export const navigateToGame = (game: GameModel, background = false) =>
  navigate(`games/${game.id}`, gameToTabData(game), background);
export const navigateToUser = (user: IUserRecord, background = false) =>
  navigate(`users/${user.id}`, userToTabData(user), background);
export const navigateToCollection = (collection: ICollectionRecord, background = false) =>
  navigate(`collections/${collection.id}`, collectionToTabData(collection), background);

export const moveTab = createAction<IMoveTabPayload>(MOVE_TAB);
export const evolveTab = createAction<IEvolveTabPayload>(EVOLVE_TAB);
export const tabEvolved = createAction<ITabEvolvedPayload>(TAB_EVOLVED);
export const newTab = createAction<INewTabPayload>(NEW_TAB);
export const closeTab = createAction<ICloseTabPayload>(CLOSE_TAB);
export const closeAllTabs = createAction<ICloseAllTabsPayload>(CLOSE_ALL_TABS);
export const showPreviousTab = createAction<IShowPreviousTabPayload>(SHOW_PREVIOUS_TAB);
export const showNextTab = createAction<IShowNextTabPayload>(SHOW_NEXT_TAB);
export const switchPage = createAction<ISwitchPagePayload>(SWITCH_PAGE);

export const tabReloaded = createAction<ITabReloadedPayload>(TAB_RELOADED);
export const tabChanged = createAction<ITabChangedPayload>(TAB_CHANGED);
export const tabsChanged = createAction<ITabsChangedPayload>(TABS_CHANGED);
export const tabsRestored = createAction<ITabsRestoredPayload>(TABS_RESTORED);
export const tabDataFetched = createAction<ITabDataFetchedPayload>(TAB_DATA_FETCHED);

export const tabParamsChanged = createAction<ITabParamsChangedPayload>(TAB_PARAMS_CHANGED);

export const openTabContextMenu = createAction<IOpenTabContextMenuPayload>(OPEN_TAB_CONTEXT_MENU);
export const openGameContextMenu = createAction<IOpenGameContextMenuPayload>(OPEN_GAME_CONTEXT_MENU);
export const unlockTab = createAction<IUnlockTabPayload>(UNLOCK_TAB);

export const openUrl = createAction<IOpenUrlPayload>(OPEN_URL);
export const reportIssue = createAction<IReportIssuePayload>(REPORT_ISSUE);
export const copyToClipboard = createAction<ICopyToClipboardPayload>(COPY_TO_CLIPBOARD);
export const handleItchioUrl = createAction<IHandleItchioUrlPayload>(HANDLE_ITCHIO_URL);
export const triggerMainAction = createAction<ITriggerMainActionPayload>(TRIGGER_MAIN_ACTION);
export const triggerOk = createAction<ITriggerOkPayload>(TRIGGER_OK);
export const triggerBack = createAction<ITriggerBackPayload>(TRIGGER_BACK);
export const triggerLocation = createAction<ITriggerLocationPayload>(TRIGGER_LOCATION);

export const viewCreatorProfile = createAction<IViewCreatorProfilePayload>(VIEW_CREATOR_PROFILE);
export const viewCommunityProfile = createAction<IViewCommunityProfilePayload>(VIEW_COMMUNITY_PROFILE);

export const tabLoading = createAction<ITabLoadingPayload>(TAB_LOADING);
