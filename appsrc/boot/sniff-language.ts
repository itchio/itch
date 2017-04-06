
import {languageSniffed} from "../actions";
import store from "../store/chrome-store";

store.dispatch(languageSniffed({lang: navigator.language}));
