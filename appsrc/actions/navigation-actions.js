
import {createAction} from 'redux-actions'
import {userToTabData, gameToTabData, collectionToTabData} from '../util/navigation'

import {
  NAVIGATE,
  FOCUS_NTH_TAB,
  MOVE_TAB,
  EVOLVE_TAB,
  TAB_EVOLVED,
  NEW_TAB,
  CLOSE_TAB,
  CLOSE_ALL_TABS,
  SHOW_PREVIOUS_TAB,
  SHOW_NEXT_TAB,
  SWITCH_PAGE,

  TAB_RELOADED,
  TAB_CHANGED,
  TABS_CHANGED,
  TABS_RESTORED,
  TAB_DATA_FETCHED,

  OPEN_TAB_CONTEXT_MENU,
  UNLOCK_TAB,

  OPEN_URL,
  COPY_TO_CLIPBOARD,
  HANDLE_ITCHIO_URL,
  TRIGGER_MAIN_ACTION,
  TRIGGER_OK,
  TRIGGER_BACK,
  TRIGGER_LOCATION,

  OPEN_PREFERENCES,
  VIEW_CREATOR_PROFILE,
  VIEW_COMMUNITY_PROFILE
} from '../constants/action-types'

const _navigate = createAction(NAVIGATE)
export const navigate = (id, data = {}) => {
  if (typeof id === 'object') {
    return _navigate(id)
  } else {
    return _navigate({id, data})
  }
}

export const focusNthTab = createAction(FOCUS_NTH_TAB)

export const navigateToGame = (game) => navigate(`games/${game.id}`, gameToTabData(game))
export const navigateToUser = (user) => navigate(`users/${user.id}`, userToTabData(user))
export const navigateToCollection = (collection) => navigate(`collections/${collection.id}`, collectionToTabData(collection))

export const moveTab = createAction(MOVE_TAB)
export const evolveTab = createAction(EVOLVE_TAB)
export const tabEvolved = createAction(TAB_EVOLVED)
export const newTab = createAction(NEW_TAB)
export const closeTab = createAction(CLOSE_TAB)
export const closeAllTabs = createAction(CLOSE_ALL_TABS)
export const showPreviousTab = createAction(SHOW_PREVIOUS_TAB)
export const showNextTab = createAction(SHOW_NEXT_TAB)
export const switchPage = createAction(SWITCH_PAGE)

export const tabReloaded = createAction(TAB_RELOADED)
export const tabChanged = createAction(TAB_CHANGED)
export const tabsChanged = createAction(TABS_CHANGED)
export const tabsRestored = createAction(TABS_RESTORED)
export const tabDataFetched = createAction(TAB_DATA_FETCHED)

export const openTabContextMenu = createAction(OPEN_TAB_CONTEXT_MENU)
export const unlockTab = createAction(UNLOCK_TAB)

export const openUrl = createAction(OPEN_URL)
export const copyToClipboard = createAction(COPY_TO_CLIPBOARD)
export const handleItchioUrl = createAction(HANDLE_ITCHIO_URL)
export const triggerMainAction = createAction(TRIGGER_MAIN_ACTION)
export const triggerOk = createAction(TRIGGER_OK)
export const triggerBack = createAction(TRIGGER_BACK)
export const triggerLocation = createAction(TRIGGER_LOCATION)

export const openPreferences = createAction(OPEN_PREFERENCES)
export const viewCreatorProfile = createAction(VIEW_CREATOR_PROFILE)
export const viewCommunityProfile = createAction(VIEW_COMMUNITY_PROFILE)
