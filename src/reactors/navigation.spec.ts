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

    let nav = () => w.store.getState().profile.navigation;

    t.same(nav().tab, "itch://featured");

    await w.dispatch(actions.navigate({ url: "itch://library" }));
    t.same(nav().tab, "itch://library");

    await w.dispatch(actions.navigate({ url: "itch://preferences" }));
    t.same(nav().openTabs.transient, ["itch://preferences"]);
    t.same(nav().tab, "itch://preferences");

    let tabChanged = false;
    w.on(actions.tabChanged, async () => {
      tabChanged = true;
    });
    await w.dispatchAndWaitImmediate(
      actions.navigate({ url: "itch://library" })
    );
    t.true(tabChanged);
  });

  s.case("handles transient tabs properly", async t => {
    const w = new TestWatcher();
    navigation(w);

    let nav = () => w.store.getState().profile.navigation;
    let instances = () => w.store.getState().profile.tabInstances;

    let constantTab = nav().tab;

    await w.dispatch(actions.navigate({ url: "https://itch.io" }));
    let id1 = nav().tab;
    t.same(
      instances()[id1].history[0].url,
      "https://itch.io",
      "set up url properly"
    );

    await w.dispatch(actions.navigate({ url: "itch://library" }));
    t.same(nav().tab, "itch://library");

    await w.dispatch(actions.focusTab({ tab: id1 }));
    t.same(nav().tab, id1, "switched to right tab by id");

    await w.dispatch(actions.closeCurrentTab({}));
    t.same(nav().tab, constantTab, "closes transient tab");

    await w.dispatch(actions.closeCurrentTab({}));
    t.same(nav().tab, constantTab, "doesn't close constant tabs");

    await w.dispatch(actions.navigate({ url: "itch://preferences" }));
    await w.dispatch(actions.navigate({ url: "itch://downloads" }));
    t.same(nav().openTabs.transient.length, 2, "opens two tabs");

    await w.dispatch(actions.closeAllTabs({}));
    t.same(nav().openTabs.transient.length, 0, "closes all tabs");
  });

  s.case("handles transient tabs properly", async t => {
    const w = new TestWatcher();
    navigation(w);

    let nav = () => w.store.getState().profile.navigation;
    let instances = () => w.store.getState().profile.tabInstances;

    await w.dispatch(actions.navigate({ url: "https://itch.io" }));
    let tab = nav().tab;
    t.same(instances()[tab].history[0].url, "https://itch.io");

    await w.dispatch(
      actions.evolveTab({
        tab,
        url: "https://itch.io/login",
        replace: false,
      })
    );
    t.same(
      instances()[tab].history[1].url,
      "https://itch.io/login",
      "evolves a tab"
    );
  });
});
