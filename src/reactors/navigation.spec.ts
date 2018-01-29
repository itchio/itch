import suite, { TestWatcher } from "../test-suite";

import navigation from "./navigation";
import { actions } from "../actions/index";

suite(__filename, s => {
  s.case("clears filters", async t => {
    const w = new TestWatcher();
    navigation(w);

    w.store.getState().preferences.onlyCompatibleGames = true;
    w.store.getState().preferences.onlyInstalledGames = true;
    w.store.getState().preferences.onlyOwnedGames = true;

    await w.dispatch(actions.clearFilters({}));
    t.false(w.store.getState().preferences.onlyCompatibleGames);
    t.false(w.store.getState().preferences.onlyInstalledGames);
    t.false(w.store.getState().preferences.onlyOwnedGames);
  });

  s.case("handles constant tabs properly", async t => {
    const w = new TestWatcher();
    navigation(w);

    let nav = () => w.store.getState().session.navigation;

    t.same(nav().tab, "featured");

    await w.dispatch(actions.navigate({ tab: "library" }));
    t.same(nav().tab, "library");

    await w.dispatch(actions.navigate({ tab: "preferences" }));
    t.same(nav().tabs.transient, ["preferences"]);
    t.same(nav().tab, "preferences");

    let tabChanged = false;
    w.on(actions.tabChanged, async () => {
      tabChanged = true;
    });
    await w.dispatchAndWaitImmediate(actions.navigate({ tab: "library" }));
    t.true(tabChanged);
  });

  s.case("handles transient tabs properly", async t => {
    const w = new TestWatcher();
    navigation(w);

    let nav = () => w.store.getState().session.navigation;
    let data = () => w.store.getState().session.tabData;

    let constantTab = nav().tab;

    await w.dispatch(actions.navigate({ tab: "url/https://itch.io" }));
    let id1 = nav().tab;
    t.same(data()[id1].path, "url/https://itch.io", "set up path properly");

    await w.dispatch(actions.navigate({ tab: "library" }));
    t.same(nav().tab, "library");

    await w.dispatch(actions.navigate({ tab: "url/https://itch.io" }));
    t.same(nav().tab, id1, "switched to right tab by path");

    await w.dispatch(actions.closeCurrentTab({}));
    t.same(nav().tab, constantTab, "closes transient tab");

    await w.dispatch(actions.closeCurrentTab({}));
    t.same(nav().tab, constantTab, "doesn't close constant tabs");

    await w.dispatch(actions.navigate({ tab: "preferences" }));
    await w.dispatch(actions.navigate({ tab: "downloads" }));
    t.same(nav().tabs.transient.length, 2, "opens two tabs");

    await w.dispatch(actions.closeAllTabs({}));
    t.same(nav().tabs.transient.length, 0, "closes all tabs");
  });

  s.case("handles transient tabs properly", async t => {
    const w = new TestWatcher();
    navigation(w);

    let nav = () => w.store.getState().session.navigation;
    let data = () => w.store.getState().session.tabData;

    await w.dispatch(actions.navigate({ tab: "url/https://itch.io" }));
    let tab = nav().tab;
    t.same(data()[tab].path, "url/https://itch.io");

    await w.dispatch(
      actions.evolveTab({ tab, path: "url/https://itch.io/login" })
    );
    t.same(data()[tab].path, "url/https://itch.io/login", "evolves a tab");
  });
});
