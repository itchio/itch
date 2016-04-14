
export * from './task-actions'
export * from './game-actions'
export * from './db-actions'
export * from './onboarding-actions'
export * from './history-actions'
export * from './notification-actions'
export * from './window-actions'
export * from './search-actions'
export * from './locale-actions'
export * from './login-actions'
export * from './sessions-actions'
export * from './menu-actions'
export * from './navigation-actions'
export * from './lifecycle-actions'
export * from './self-update-actions'
export * from './install-locations-actions'

import {createAction} from 'redux-actions'

import {
  LANGUAGE_SNIFFED,
  LANGUAGE_CHANGED,

  OPEN_MODAL,
  CLOSE_MODAL,

  UPDATE_PREFERENCES,

  FETCH_COLLECTION_GAMES,
  COLLECTION_GAMES_FETCHED
} from '../constants/action-types'

export const languageSniffed = createAction(LANGUAGE_SNIFFED)
export const languageChanged = createAction(LANGUAGE_CHANGED)

export const openModal = createAction(OPEN_MODAL)
export const closeModal = createAction(CLOSE_MODAL)

export const updatePreferences = createAction(UPDATE_PREFERENCES)

export const fetchCollectionGames = createAction(FETCH_COLLECTION_GAMES)
export const collectionGamesFetched = createAction(COLLECTION_GAMES_FETCHED)
