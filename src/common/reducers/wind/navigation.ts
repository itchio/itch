import { reject, omit, map, filter, difference } from "underscore";

import { NavigationState, TabDataSave } from "common/types";

import { actions } from "common/actions";
import reducer from "common/reducers/reducer";
import arrayMove from "array-move";

const initialState: NavigationState = {
  openTabs: ["initial-tab"],
  tab: "initial-tab",
};

export default reducer<NavigationState>(initialState, (on) => {
  on(actions.tabOpened, (state, action) => {
    const { tab, background } = action.payload;
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
    let newOpenTabs = [];
    let added = false;
    for (const openTab of openTabs) {
      newOpenTabs.push(openTab);
      if (openTab === state.tab) {
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
      openTabs: difference(state.openTabs, tabs),
      tab: andFocus ? andFocus : state.tab,
    };
  });

  on(actions.tabsRestored, (state, action) => {
    const { snapshot } = action.payload;

    const tab = snapshot.current || state.tab;
    const openTabs = filter(
      map(snapshot.items, (tab: TabDataSave) => {
        return tab.id;
      }),
      (x) => !!x
    );

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
