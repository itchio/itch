// This file is the entry point for renderer processes

import env from "renderer/env";

env.setNodeEnv();

if (process.env.NODE_ENV === "production") {
  // cf. https://electronjs.org/docs/tutorial/security
  (window as any).eval = global.eval = function () {
    throw new Error(`Sorry, this app does not support window.eval().`);
  };
}

import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import store, { hydrated } from "renderer/store";

import App from "renderer/App";
import { actions } from "common/actions";
import { ExtendedWindow } from "common/types";
import { ambientWind } from "common/util/navigation";

let appNode: Element | null;

function render(RealApp: typeof App) {
  document.querySelector("body")!.classList.remove("loading");
  appNode = document.querySelector("#app");

  ReactDOM.render(
    <Provider store={store}>
      <RealApp />
    </Provider>,
    appNode
  );
}

window.addEventListener("beforeunload", () => {
  if (appNode) {
    ReactDOM.unmountComponentAtNode(appNode);
    appNode = null;
  }
});

async function start() {
  const opts = new URLSearchParams(location.search);
  const extWindow = window as unknown as ExtendedWindow;
  extWindow.windSpec = {
    wind: String(opts.get("wind")),
    role: String(opts.get("role")) as any,
  };

  // Wait for store-sync to hydrate state from the main process. Without
  // this the winds polling below would wait forever on a blank window.
  try {
    await hydrated;
  } catch (e) {
    document.querySelector("body")!.classList.remove("loading");
    const node = document.querySelector("#app");
    if (node) {
      node.textContent = `itch failed to start: ${e}`;
    }
    throw e;
  }

  await new Promise<void>((resolve) => {
    const checkState = () => {
      const state = store.getState();
      if (state.winds && Object.keys(state.winds).length > 0) {
        resolve();
      }
    };
    checkState();
    const unsubscribe = store.subscribe(() => {
      checkState();
      if (
        store.getState().winds &&
        Object.keys(store.getState().winds).length > 0
      ) {
        unsubscribe();
      }
    });
  });

  // registered post-hydration: a dispatch before REPLACE_STATE lands
  // would be forwarded to main but erased locally by the state snapshot
  document.addEventListener("drop", (event) => {
    event.preventDefault();
    const urls = event.dataTransfer?.getData("text/uri-list");
    if (urls) {
      urls.split("\n").forEach((url) => {
        store.dispatch(actions.navigate({ wind: ambientWind(), url }));
      });
    }
  });

  render(App);

  // it isn't a guarantee that this code will run
  // after the main process starts listening for
  // this event. Keep sending it so that the main
  // process is sure to receive it
  const intervalId = setInterval(() => {
    store.dispatch(actions.rootWindowReady({}));
  }, 500);

  store.watcher.on(actions.boot, () => {
    clearInterval(intervalId);
  });
}

start();

// Catch unhandled form submissions that would navigate away from the app
document.addEventListener("submit", (event) => {
  if (event.defaultPrevented) {
    // handled by a form's onSubmit (e.g. the login form)
    return;
  }
  console.error(
    "Unhandled form submission intercepted. This likely indicates a button " +
      'inside a form is missing type="button". Form:',
    event.target
  );
  event.preventDefault();
});
