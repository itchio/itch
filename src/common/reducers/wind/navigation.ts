import { NavigationState, TabDataSave } from "common/types";

import { actions } from "common/actions";
import reducer from "common/reducers/reducer";

function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const result = [...arr];
  const startIndex = from < 0 ? result.length + from : from;
  if (startIndex >= 0 && startIndex < result.length) {
    const endIndex = to < 0 ? result.length + to : to;
    const [item] = result.splice(from, 1);
    result.splice(endIndex, 0, item);
  }
  return result;
}

const initialState: NavigationState = {
  openTabs: ["initial-tab"],
  tab: "initial-tab",
};

export default reducer<NavigationState>(initialState, (on) => {
  on(actions.tabOpened, (state, action) => {
    const { tab, background, insertAfter } = action.payload;
    if (!tab) {
      return state;
    }

    // Try to open the new tab to the right of the current tab.
    // Note that, at the time of this writing, Chrome 69 does something
    // smarter. It behaves as if it keeps track of which tab has been
    // opened by whom. So if you have
    //   - A B C
    // And B opens two tabs, you'll have:
    //   - A B C
    //   - A B B1 C
    //   - A B B1 B2 C
    // Whereas the following code doesn't keep track of that, so we'll have:
    //   - A B C
    //   - A B B1 C
    //   - A B B2 B1 C
    // and so on. Fixing that would require changing the structure of the app's
    // state, so let's not worry about it for now.
    const { openTabs } = state;
    const anchor = insertAfter ?? state.tab;
    let newOpenTabs = [];
    let added = false;
    for (const openTab of openTabs) {
      newOpenTabs.push(openTab);
      if (openTab === anchor) {
        added = true;
        newOpenTabs.push(tab);
      }
    }
    if (!added) {
      // if we didn't find the current tab
      // then we just append it
      newOpenTabs.push(tab);
    }

    return {
      ...state,
      tab: background ? state.tab : tab,
      openTabs: newOpenTabs,
    };
  });

  on(actions.tabFocused, (state, action) => {
    const { tab } = action.payload;

    return {
      ...state,
      tab,
    };
  });

  on(actions.moveTab, (state, action) => {
    const { before, after } = action.payload;

    const { openTabs } = state;

    const newOpenTabs = arrayMove(openTabs, before, after);

    return {
      ...state,
      openTabs: newOpenTabs,
    };
  });

  on(actions.tabsClosed, (state, action) => {
    const { tabs, andFocus } = action.payload;
    return {
      ...state,
      openTabs: state.openTabs.filter((t) => !tabs.includes(t)),
      tab: andFocus ? andFocus : state.tab,
    };
  });

  on(actions.tabsRestored, (state, action) => {
    const { snapshot } = action.payload;

    const tab = snapshot.current || state.tab;
    const openTabs = (snapshot.items ?? [])
      .map((tab: TabDataSave) => tab.id)
      .filter((x) => !!x);

    return {
      ...state,
      tab,
      openTabs,
    };
  });

  on(actions.loggedOut, (state, action) => {
    return initialState;
  });
});
