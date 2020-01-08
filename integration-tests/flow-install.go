package main

import (
	"fmt"
	"time"
)

const testGameName = "111 first"
const testGameID = 149766

func installFlow(r *runner) {
	r.logf("Searching for known game")
	must(r.click("#search"))
	must(r.setValue("#search", testGameName))

	r.logf("Opening it")
	var gameResultSelector = fmt.Sprintf(".results-container .game-search-result[data-game-id='%d']", testGameID)
	must(r.click(gameResultSelector))

	mainWindowHandle := r.mustGetSingleWindowHandle()

	r.logf("Installing it")
	var mainActionSelector = fmt.Sprintf(".meat-tab.visible .main-action[data-game-id='%d']", testGameID)
	must(r.waitUntilTextExists(mainActionSelector, "Install"))
	must(r.click(mainActionSelector))

	must(r.click("#modal-install-now"))

	r.logf("Launching it")
	must(r.waitUntilTextExistsWithTimeout(mainActionSelector, "Launch", 30*time.Second))
	must(r.click(mainActionSelector))

	r.logf("Force-closing it")
	must(r.waitUntilTextExists(mainActionSelector, "Running"))
	must(r.click(mainActionSelector))
	must(r.click("#modal-force-close"))

	r.logf("Making sure it's closed")
	must(r.waitUntilTextExists(mainActionSelector, "Launch"))

	r.logf("Switching to downloads window")
	must(r.click("#sidebar a[href='itch://downloads']"))
	r.mustWaitForWindowQuantity(2)
	r.mustSwitchToOtherWindow(mainWindowHandle)

	r.logf("Making sure our download shows up as finished")
	var downloadRowSelector = fmt.Sprintf(".meat-tab.visible .download-row-item.finished[data-game-id='%d'] .control--title", testGameID)
	must(r.waitUntilTextExists(downloadRowSelector, "111 first"))

	must(r.takeScreenshot("finished download"))

	r.logf("Clearing downloads")
	must(r.click(".meat-tab.visible .downloads-clear-all"))

	r.logf("Making sure downloads list is empty now")
	must(r.waitForVisible(".meat-tab.visible .no-active-downloads"))

	r.logf("Closing downloads window")
	r.mustCloseCurrentWindowAndSwitchTo(mainWindowHandle)

	must(r.takeScreenshot("installed game tab"))

	r.logf("Re-installing it")
	must(r.click(".meat-tab.visible .manage-game"))
	must(r.click(".manage-cave"))
	must(r.click(".manage-reinstall"))
	must(r.waitUntilTextExists(mainActionSelector, "Launch"))

	r.logf("Closing downloads window")
	r.mustCloseAllOtherWindows()

	r.logf("Opening library")
	must(r.click("#sidebar a[href='itch://library']"))

	r.logf("Opening installed items")
	must(r.click("#library-installed"))

	r.logf("Opening install locations")
	must(r.click("#manage-install-locations"))

	must(r.takeScreenshot("install location tab"))

	r.logf("Making sure our installed game shows up")
	var rowSelector = fmt.Sprintf(".meat-tab.visible .stripe--item[data-game-id='%d']", testGameID)
	must(r.click(rowSelector))

	r.logf("Uninstalling it")
	must(r.waitUntilTextExists(mainActionSelector, "Launch"))
	must(r.click(".meat-tab.visible .manage-game"))
	must(r.takeScreenshot("managing uploads"))
	must(r.click(".manage-cave"))
	must(r.click(".manage-uninstall"))
	must(r.waitUntilTextExists(mainActionSelector, "Install"))

	r.mustCloseAllOtherWindows()
}
