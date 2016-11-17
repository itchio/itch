
export * from "./task-actions"
export * from "./download-actions"
export * from "./game-actions"
export * from "./db-actions"
export * from "./onboarding-actions"
export * from "./history-actions"
export * from "./notification-actions"
export * from "./window-actions"
export * from "./search-actions"
export * from "./locale-actions"
export * from "./login-actions"
export * from "./sessions-actions"
export * from "./menu-actions"
export * from "./navigation-actions"
export * from "./lifecycle-actions"
export * from "./self-update-actions"
export * from "./install-locations-actions"
export * from "./modal-actions"

import { createAction } from "redux-actions";

import {
    LANGUAGE_SNIFFED, ILanguageSniffedPayload,
    LANGUAGE_CHANGED, ILanguageChangedPayload,

    UPDATE_PREFERENCES, IUpdatePreferencesPayload,

    FETCH_COLLECTION_GAMES, IFetchCollectionGamesPayload,
    COLLECTION_GAMES_FETCHED, ICollectionGamesFetchedPayload,

    ENABLE_BONUS, IEnableBonusPayload,
    DISABLE_BONUS, IDisableBonusPayload,

    OPEN_AT_LOGIN_ERROR, IOpenAtLoginErrorPayload,
} from "../constants/action-types";

export const languageSniffed = createAction<ILanguageSniffedPayload>(LANGUAGE_SNIFFED);
export const languageChanged = createAction<ILanguageChangedPayload>(LANGUAGE_CHANGED);

export const updatePreferences = createAction<IUpdatePreferencesPayload>(UPDATE_PREFERENCES);

export const fetchCollectionGames = createAction<IFetchCollectionGamesPayload>(FETCH_COLLECTION_GAMES);
export const collectionGamesFetched = createAction<ICollectionGamesFetchedPayload>(COLLECTION_GAMES_FETCHED);

export const enableBonus = createAction<IEnableBonusPayload>(ENABLE_BONUS);
export const disableBonus = createAction<IDisableBonusPayload>(DISABLE_BONUS);

export const openAtLoginError = createAction<IOpenAtLoginErrorPayload>(OPEN_AT_LOGIN_ERROR);
