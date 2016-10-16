
export * from './task-actions'
export * from './download-actions'
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

import * as uuid from 'node-uuid'

import { createAction } from 'redux-actions'

import {
    LANGUAGE_SNIFFED,
    LANGUAGE_CHANGED,

    OPEN_MODAL,
    CLOSE_MODAL,
    MODAL_CLOSED,
    MODAL_RESPONSE,

    UPDATE_PREFERENCES,

    FETCH_COLLECTION_GAMES,
    COLLECTION_GAMES_FETCHED
} from '../constants/action-types'

export const languageSniffed = createAction(LANGUAGE_SNIFFED)
export const languageChanged = createAction(LANGUAGE_CHANGED)

const _openModal = createAction(OPEN_MODAL)
export const openModal = (payload = {}) => _openModal(Object.assign({}, payload, { id: uuid.v4() }))
export const closeModal = createAction(CLOSE_MODAL)
export const modalClosed = createAction(MODAL_CLOSED)
export const modalResponse = createAction(MODAL_RESPONSE)

export const updatePreferences = createAction(UPDATE_PREFERENCES)

export const fetchCollectionGames = createAction(FETCH_COLLECTION_GAMES)
export const collectionGamesFetched = createAction(COLLECTION_GAMES_FETCHED)
