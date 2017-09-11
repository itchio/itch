import { createAction } from "redux-actions";
import {
  userToTabData,
  gameToTabData,
  collectionToTabData,
} from "../util/navigation";

import { IGame } from "../db/models/game";
import { IUser } from "../db/models/user";
import { ICollection } from "../db/models/collection";

import uuid from "../util/uuid";

import {
  NAVIGATE,
  INavigatePayload,
  OPEN_TAB,
  IOpenTabPayload,
  FOCUS_TAB,
  IFocusTabPayload,
  FOCUS_NTH_TAB,
  IFocusNthTabPayload,
  MOVE_TAB,
  IMoveTabPayload,
  EVOLVE_TAB,
  IEvolveTabPayload,
  TAB_EVOLVED,
  ITabEvolvedPayload,
  NEW_TAB,
  INewTabPayload,
  CLOSE_TAB,
  ICloseTabPayload,
  CLOSE_CURRENT_TAB,
  ICloseCurrentTabPayload,
  CLOSE_ALL_TABS,
  ICloseAllTabsPayload,
  SHOW_PREVIOUS_TAB,
  IShowPreviousTabPayload,
  SHOW_NEXT_TAB,
  IShowNextTabPayload,
  SWITCH_PAGE,
  ISwitchPagePayload,
  TAB_RELOADED,
  ITabReloadedPayload,
  TAB_CHANGED,
  ITabChangedPayload,
  TABS_CHANGED,
  ITabsChangedPayload,
  TABS_RESTORED,
  ITabsRestoredPayload,
  TAB_DATA_FETCHED,
  ITabDataFetchedPayload,
  OPEN_TAB_CONTEXT_MENU,
  IOpenTabContextMenuPayload,
  OPEN_GAME_CONTEXT_MENU,
  IOpenGameContextMenuPayload,
  UNLOCK_TAB,
  IUnlockTabPayload,
  OPEN_URL,
  IOpenUrlPayload,
  PROCESS_URL_ARGUMENTS,
  IProcessUrlArgumentsPayload,
  REPORT_ISSUE,
  IReportIssuePayload,
  COPY_TO_CLIPBOARD,
  ICopyToClipboardPayload,
  HANDLE_ITCHIO_URL,
  IHandleItchioUrlPayload,
  VIEW_CREATOR_PROFILE,
  IViewCreatorProfilePayload,
  VIEW_COMMUNITY_PROFILE,
  IViewCommunityProfilePayload,
  TAB_LOADING,
  ITabLoadingPayload,
  TAB_PARAMS_CHANGED,
  ITabParamsChangedPayload,
  TAB_PAGINATION_CHANGED,
  ITabPaginationChangedPayload,
  ANALYZE_PAGE,
  IAnalyzePagePayload,
  OPEN_DEV_TOOLS,
  IOpenDevToolsPayload,
  TAB_GOT_WEB_CONTENTS,
  ITabGotWebContentsPayload,
  CLEAN_TAB_DATA,
  ICleanTabDataPayload,
  ITriggerPayload,
  TRIGGER,
  IViewChangelogPayload,
  VIEW_CHANGELOG,
  ICloseOtherTabsPayload,
  ICloseTabsBelowPayload,
  CLOSE_OTHER_TABS,
  CLOSE_TABS_BELOW,
  POPUP_CONTEXT_MENU,
  IPopupContextMenuPayload,
  ICloseContextMenuPayload,
  CLOSE_CONTEXT_MENU,
} from "../constants/action-types";

export const navigate = createAction<INavigatePayload>(NAVIGATE);

export const internalOpenTab = createAction<IOpenTabPayload>(OPEN_TAB);
export const openTab = (payload: IOpenTabPayload) => {
  return internalOpenTab({ ...payload, tab: uuid() });
};

export const focusTab = createAction<IFocusTabPayload>(FOCUS_TAB);
export const focusNthTab = createAction<IFocusNthTabPayload>(FOCUS_NTH_TAB);

interface INavigateToGamePayload {
  game: IGame;
  background?: boolean;
}
export const navigateToGame = (payload: INavigateToGamePayload) =>
  navigate({
    tab: `games/${payload.game.id}`,
    data: gameToTabData(payload.game),
    background: payload.background,
  });

interface INavigateToUserPayload {
  user: IUser;
  background?: boolean;
}
export const navigateToUser = (payload: INavigateToUserPayload) =>
  navigate({
    tab: `users/${payload.user.id}`,
    data: userToTabData(payload.user),
    background: payload.background,
  });

interface INavigateToCollectionPayload {
  collection: ICollection;
  background?: boolean;
}
export const navigateToCollection = (payload: INavigateToCollectionPayload) =>
  navigate({
    tab: `collections/${payload.collection.id}`,
    data: collectionToTabData(payload.collection),
    background: payload.background,
  });

export const moveTab = createAction<IMoveTabPayload>(MOVE_TAB);
export const evolveTab = createAction<IEvolveTabPayload>(EVOLVE_TAB);
export const cleanTabData = createAction<ICleanTabDataPayload>(CLEAN_TAB_DATA);
export const tabEvolved = createAction<ITabEvolvedPayload>(TAB_EVOLVED);
export const newTab = createAction<INewTabPayload>(NEW_TAB);
export const closeTab = createAction<ICloseTabPayload>(CLOSE_TAB);
export const closeCurrentTab = createAction<ICloseCurrentTabPayload>(
  CLOSE_CURRENT_TAB
);
export const closeAllTabs = createAction<ICloseAllTabsPayload>(CLOSE_ALL_TABS);
export const closeOtherTabs = createAction<ICloseOtherTabsPayload>(
  CLOSE_OTHER_TABS
);
export const closeTabsBelow = createAction<ICloseTabsBelowPayload>(
  CLOSE_TABS_BELOW
);
export const showPreviousTab = createAction<IShowPreviousTabPayload>(
  SHOW_PREVIOUS_TAB
);
export const showNextTab = createAction<IShowNextTabPayload>(SHOW_NEXT_TAB);
export const switchPage = createAction<ISwitchPagePayload>(SWITCH_PAGE);

export const tabReloaded = createAction<ITabReloadedPayload>(TAB_RELOADED);
export const tabChanged = createAction<ITabChangedPayload>(TAB_CHANGED);
export const tabsChanged = createAction<ITabsChangedPayload>(TABS_CHANGED);
export const tabsRestored = createAction<ITabsRestoredPayload>(TABS_RESTORED);
export const tabDataFetched = createAction<ITabDataFetchedPayload>(
  TAB_DATA_FETCHED
);

export const tabParamsChanged = createAction<ITabParamsChangedPayload>(
  TAB_PARAMS_CHANGED
);
export const tabPaginationChanged = createAction<ITabPaginationChangedPayload>(
  TAB_PAGINATION_CHANGED
);

export const openTabContextMenu = createAction<IOpenTabContextMenuPayload>(
  OPEN_TAB_CONTEXT_MENU
);
export const openGameContextMenu = createAction<IOpenGameContextMenuPayload>(
  OPEN_GAME_CONTEXT_MENU
);

export const popupContextMenu = createAction<IPopupContextMenuPayload>(
  POPUP_CONTEXT_MENU
);
export const closeContextMenu = createAction<ICloseContextMenuPayload>(
  CLOSE_CONTEXT_MENU
);

export const unlockTab = createAction<IUnlockTabPayload>(UNLOCK_TAB);

export const openUrl = createAction<IOpenUrlPayload>(OPEN_URL);
export const processUrlArguments = createAction<IProcessUrlArgumentsPayload>(
  PROCESS_URL_ARGUMENTS
);
export const reportIssue = createAction<IReportIssuePayload>(REPORT_ISSUE);
export const copyToClipboard = createAction<ICopyToClipboardPayload>(
  COPY_TO_CLIPBOARD
);
export const viewChangelog = createAction<IViewChangelogPayload>(
  VIEW_CHANGELOG
);
export const handleItchioUrl = createAction<IHandleItchioUrlPayload>(
  HANDLE_ITCHIO_URL
);

export const trigger = createAction<ITriggerPayload>(TRIGGER);

export const viewCreatorProfile = createAction<IViewCreatorProfilePayload>(
  VIEW_CREATOR_PROFILE
);
export const viewCommunityProfile = createAction<IViewCommunityProfilePayload>(
  VIEW_COMMUNITY_PROFILE
);

export const tabLoading = createAction<ITabLoadingPayload>(TAB_LOADING);
export const tabGotWebContents = createAction<ITabGotWebContentsPayload>(
  TAB_GOT_WEB_CONTENTS
);

export const openDevTools = createAction<IOpenDevToolsPayload>(OPEN_DEV_TOOLS);
export const analyzePage = createAction<IAnalyzePagePayload>(ANALYZE_PAGE);
