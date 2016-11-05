
import delay from "../reactors/delay";

import {IStore} from "../types";
import {
  IAction,
  IFocusSearchPayload,
  ICloseSearchPayload,
  IFocusFilterPayload,
  IClearFiltersPayload,
  ISearchHighlightOffsetPayload,
} from "../constants/action-types";

async function focusSearch (store: IStore, action: IAction<IFocusSearchPayload>) {
  const searchBar = document.querySelector("#search") as HTMLInputElement;
  if (searchBar) {
    searchBar.focus();
    searchBar.select();
  }
}

async function closeSearch (store: IStore, action: IAction<ICloseSearchPayload>) {
  const searchBar = document.querySelector("#search") as HTMLInputElement;
  // hasFocus(Element) isn't in typescript typings
  if (searchBar && (document as any).hasFocus(searchBar)) {
    searchBar.blur();
  }
}

async function focusFilter (store: IStore, action: IAction<IFocusFilterPayload>) {
  const filterBar = document.querySelector(".hub-meat-tab.visible .filter-input-field") as HTMLInputElement;
  if (filterBar) {
    filterBar.focus();
    filterBar.select();
  }
}

async function clearFilters (store: IStore, action: IAction<IClearFiltersPayload>) {
  const filterBar = document.querySelector(".hub-meat-tab.visible .filter-input-field") as HTMLInputElement;
  if (filterBar) {
    filterBar.value = "";
  }
}

async function searchHighlightOffset (store: IStore, action: IAction<ISearchHighlightOffsetPayload>) {
  await delay(20);
  const searchResults = document.querySelector(".hub-search-results.active");
  if (searchResults) {
    const chosen = searchResults.querySelector(".search-result.chosen");
    if (chosen) {
      // this isn't part of DOM spec yet apparently? at least not typescript typings
      // but electron is powered by blink which definitely ahs it
      (chosen as any).scrollIntoViewIfNeeded();
    }
  }
}

export default {focusSearch, closeSearch, focusFilter, clearFilters, searchHighlightOffset};
