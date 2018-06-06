// import { describe, it, assert, TestWatcher } from "test";

// import navigation from "./navigation";
// import { actions } from "common/actions/index";

// describe("navigation reactor", () => {
//   it("clears filters", async () => {
//     const w = new TestWatcher();
//     navigation(w);

//     w.store.getState().preferences.onlyCompatibleGames = true;
//     w.store.getState().preferences.onlyInstalledGames = true;
//     w.store.getState().preferences.onlyOwnedGames = true;

//     await w.dispatch(actions.clearFilters({}));
//     assert.isFalse(w.store.getState().preferences.onlyCompatibleGames);
//     assert.isFalse(w.store.getState().preferences.onlyInstalledGames);
//     assert.isFalse(w.store.getState().preferences.onlyOwnedGames);
//   });

//   it("handles constant tabs properly", async () => {
//     const w = new TestWatcher();
//     navigation(w);

//     let nav = () => w.store.getState().profile.navigation;

//     assert.equal(nav().tab, "itch://featured");

//     await w.dispatch(actions.navigate({ url: "itch://library" }));
//     assert.equal(nav().tab, "itch://library");

//     await w.dispatch(actions.navigate({ url: "itch://preferences" }));
//     assert.deepEqual(nav().openTabs.transient, ["itch://preferences"]);
//     assert.equal(nav().tab, "itch://preferences");

//     let tabChanged = false;
//     w.on(actions.tabChanged, async () => {
//       tabChanged = true;
//     });
//     await w.dispatchAndWaitImmediate(
//       actions.navigate({ url: "itch://library" })
//     );
//     assert.isTrue(tabChanged);
//   });

//   it("handles transient tabs properly", async () => {
//     const w = new TestWatcher();
//     navigation(w);

//     let nav = () => w.store.getState().profile.navigation;
//     let instances = () => w.store.getState().profile.tabInstances;

//     let constantTab = nav().tab;

//     await w.dispatch(actions.navigate({ url: "https://itch.io" }));
//     let id1 = nav().tab;
//     assert.equal(
//       instances()[id1].history[0].url,
//       "https://itch.io",
//       "set up url properly"
//     );

//     await w.dispatch(actions.navigate({ url: "itch://library" }));
//     assert.equal(nav().tab, "itch://library");

//     await w.dispatch(actions.focusTab({ tab: id1 }));
//     assert.equal(nav().tab, id1, "switched to right tab by id");

//     await w.dispatch(actions.closeCurrentTab({}));
//     assert.equal(nav().tab, constantTab, "closes transient tab");

//     await w.dispatch(actions.closeCurrentTab({}));
//     assert.equal(nav().tab, constantTab, "doesn't close constant tabs");

//     await w.dispatch(actions.navigate({ url: "itch://preferences" }));
//     await w.dispatch(actions.navigate({ url: "itch://downloads" }));
//     assert.equal(nav().openTabs.transient.length, 2, "opens two tabs");

//     await w.dispatch(actions.closeAllTabs({}));
//     assert.equal(nav().openTabs.transient.length, 0, "closes all tabs");
//   });

//   it("handles transient tabs properly (2)", async () => {
//     const w = new TestWatcher();
//     navigation(w);

//     let nav = () => w.store.getState().profile.navigation;
//     let instances = () => w.store.getState().profile.tabInstances;

//     await w.dispatch(actions.navigate({ url: "https://itch.io" }));
//     let tab = nav().tab;
//     assert.equal(instances()[tab].history[0].url, "https://itch.io");

//     await w.dispatch(
//       actions.evolveTab({
//         tab,
//         url: "https://itch.io/login",
//         replace: false,
//       })
//     );
//     assert.equal(
//       instances()[tab].history[1].url,
//       "https://itch.io/login",
//       "evolves a tab"
//     );
//   });
// });
