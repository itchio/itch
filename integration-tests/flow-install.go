package main

import (
	"fmt"
	"time"
)

const testGameName = "111 first"
const testGameID = 149766

func installFlow(r *runner) {
	r.logf("searching for known game")
	must(r.click("#search"))
	must(r.setValue("#search", testGameName))

	r.logf("opening it")
	var gameResultSelector = fmt.Sprintf(".results-container .game-search-result[data-game-id='%d']", testGameID)
	must(r.click(gameResultSelector))

	mainWindowHandle := r.mustGetSingleWindowHandle()

	r.logf("installing it")
	var mainActionSelector = fmt.Sprintf(".meat-tab.visible .main-action[data-game-id='%d']", testGameID)
	must(r.waitUntilTextExists(mainActionSelector, "Install"))
	must(r.click(mainActionSelector))

	must(r.click("#modal-install-now"))

	r.logf("launching it")
	must(r.waitUntilTextExistsWithTimeout(mainActionSelector, "Launch", 30*time.Second))
	must(r.click(mainActionSelector))

	r.logf("force-closing it")
	must(r.waitUntilTextExists(mainActionSelector, "Running"))
	must(r.click(mainActionSelector))
	must(r.click("#modal-force-close"))

	r.logf("making sure it's closed")
	must(r.waitUntilTextExists(mainActionSelector, "Launch"))

	r.logf("switching to downloads window")
	must(r.click("#sidebar a[href='itch://downloads']"))
	r.mustWaitForWindowQuantity(2)
	r.mustSwitchToOtherWindow(mainWindowHandle)

	r.logf("making sure our download shows up as finished")
	var downloadRowSelector = fmt.Sprintf(".meat-tab.visible .download-row-item.finished[data-game-id='%d'] .control--title", testGameID)
	must(r.waitUntilTextExists(downloadRowSelector, "111 first"))

	r.takeScreenshot("finished download")

	r.logf("clearing downloads")
	must(r.click(".meat-tab.visible .downloads-clear-all"))

	r.logf("making sure downloads list is empty now")
	must(r.waitForVisible(".meat-tab.visible .no-active-downloads"))

	r.logf("closing downloads window")
	// As of Electron 9.2.0, this fails in CI with "failed to close"
	// r.mustCloseCurrentWindowAndSwitchTo(mainWindowHandle)
	// This is the current workaround:
	r.mustSwitchToWindow(mainWindowHandle)

	r.takeScreenshot("installed game tab")

	r.logf("re-installing it")
	must(r.click(".meat-tab.visible .manage-game"))
	must(r.click(".manage-cave"))
	must(r.click(".manage-reinstall"))
	must(r.waitUntilTextExists(mainActionSelector, "Launch"))

	// All window closing occasionally fails as of Electron 9.2.0
	// r.logf("closing downloads window")
	// r.mustCloseAllOtherWindows()

	r.logf("opening library")
	must(r.click("#sidebar a[href='itch://library']"))

	r.logf("opening installed items")
	must(r.click("#library-installed"))

	r.logf("opening install locations")
	must(r.click("#manage-install-locations"))

	r.takeScreenshot("install location tab")

	r.logf("making sure our installed game shows up")
	var rowSelector = fmt.Sprintf(".meat-tab.visible .stripe--item[data-game-id='%d']", testGameID)
	must(r.click(rowSelector))

	r.logf("uninstalling it")
	must(r.waitUntilTextExists(mainActionSelector, "Launch"))
	must(r.click(".meat-tab.visible .manage-game"))
	r.takeScreenshot("managing uploads")
	must(r.click(".manage-cave"))
	must(r.click(".manage-uninstall"))
	must(r.waitUntilTextExists(mainActionSelector, "Install"))

	// as of electron 9.2.0, fails
	// r.mustCloseAllOtherWindows()
}
