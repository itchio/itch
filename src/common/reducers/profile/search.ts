import SearchExamples from "common/constants/search-examples";

import { ProfileSearchState } from "common/types";

import { actions } from "common/actions";
import reducer from "../reducer";
import { isEmpty } from "underscore";

function randomExampleIndex() {
  return Math.floor(Math.random() * (SearchExamples.length - 1));
}

let searchExampleIndex = randomExampleIndex();

const initialState = {
  example: SearchExamples[searchExampleIndex],
  typedQuery: "",
  query: "",
  open: false,
  loading: false,
  highlight: 0,
  results: null,
} as ProfileSearchState;

export default reducer<ProfileSearchState>(initialState, on => {
  on(actions.search, (state, action) => {
    const typedQuery = action.payload.query;
    if (typedQuery == state.typedQuery) {
      return state;
    }

    return {
      ...state,
      typedQuery,
      highlight: 0,
    };
  });

  on(actions.searchHighlightOffset, (state, action) => {
    const { offset, relative } = action.payload;
    let highlight = offset;
    if (relative) {
      highlight = state.highlight + offset;
    }

    let numGames = 0;
    if (
      state.results &&
      state.results.games &&
      !isEmpty(state.results.games.ids)
    ) {
      numGames = state.results.games.ids.length;
    }

    if (highlight < 0) {
      highlight = numGames - 1;
    }
    if (highlight >= numGames) {
      highlight = 0;
    }

    return {
      ...state,
      highlight,
    };
  });

  on(actions.searchFetched, (state, action) => {
    const { query, results } = action.payload;
    if (query != state.typedQuery) {
      return state;
    }

    const example = SearchExamples[randomExampleIndex()];
    return {
      ...state,
      results,
      query,
      example,
    };
  });

  on(actions.searchStarted, (state, action) => {
    return { ...state, loading: true, highlight: 0 };
  });

  on(actions.searchFinished, (state, action) => {
    return { ...state, loading: false };
  });

  on(actions.focusSearch, (state, action) => {
    return { ...state, open: true };
  });

  on(actions.closeSearch, (state, action) => {
    return { ...state, open: false };
  });
});
