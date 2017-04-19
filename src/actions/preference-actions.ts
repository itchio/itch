
import {createAction} from "redux-actions";

import {
    LANGUAGE_SNIFFED, ILanguageSniffedPayload,
    LANGUAGE_CHANGED, ILanguageChangedPayload,

    OPEN_APP_LOG, IOpenAppLogPayload,

    UPDATE_PREFERENCES, IUpdatePreferencesPayload,
    PREFERENCES_LOADED, IPreferencesLoadedPayload,

    CLEAR_BROWSING_DATA_REQUEST, IClearBrowsingDataRequestPayload,
    CLEAR_BROWSING_DATA, IClearBrowsingDataPayload,

    OPEN_AT_LOGIN_ERROR, IOpenAtLoginErrorPayload,
    PROXY_SETTINGS_DETECTED, IProxySettingsDetectedPayload,
} from "../constants/action-types";

export const languageSniffed = createAction<ILanguageSniffedPayload>(LANGUAGE_SNIFFED);
export const languageChanged = createAction<ILanguageChangedPayload>(LANGUAGE_CHANGED);

export const openAppLog = createAction<IOpenAppLogPayload>(OPEN_APP_LOG);

export const updatePreferences = createAction<IUpdatePreferencesPayload>(UPDATE_PREFERENCES);
export const preferencesLoaded = createAction<IPreferencesLoadedPayload>(PREFERENCES_LOADED);

export const clearBrowsingDataRequest = createAction<IClearBrowsingDataRequestPayload>(CLEAR_BROWSING_DATA_REQUEST);
export const clearBrowsingData = createAction<IClearBrowsingDataPayload>(CLEAR_BROWSING_DATA);

export const openAtLoginError = createAction<IOpenAtLoginErrorPayload>(OPEN_AT_LOGIN_ERROR);
export const proxySettingsDetected = createAction<IProxySettingsDetectedPayload>(PROXY_SETTINGS_DETECTED);
