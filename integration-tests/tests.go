package main

import "fmt"

func runTests(r *runner) {
	login(r)
	libraryViewsAndSorts(r)
	installAndLaunchGame(r)
}

func login(r *runner) {
	r.logf("Logging in with valid credentials")
	// using workaround so we don't get hit by recaptcha
	must(r.setValue("#login-username", "#api-key"))
	must(r.click("#login-next"))
	must(r.setValue("#login-password", testAccountAPIKey))
	must(r.click("#login-proceed"))
	must(r.waitForVisible(".user-menu"))
}
func libraryViewsAndSorts(r *runner) {
	r.logf("Navigating to owned games")
	must(r.click(".sidebar .item[data-source='profile']"))

	r.logf("Switching to list view")
	must(r.click(".dropdown[data-name='layout']"))
	must(r.click(".dropdown-options[data-name='layout'] .dropdown-option[data-value='list']"))

	r.logf("Sorting by title, A-Z")
	must(r.click(".dropdown[data-name='sort-field']"))
	must(r.click(".dropdown-options[data-name='sort-field'] .dropdown-option[data-value='default']"))
	must(r.click(".dropdown[data-name='sort-direction']"))
	must(r.click(".dropdown-options[data-name='sort-direction'] .dropdown-option[data-value='false']"))

	var firstTitleSelector = ".list .row:first-child .title"

	r.logf("Ensuring the A-Z sorting is correct")
	must(r.waitUntilTextExists(firstTitleSelector, "111 first"))

	r.logf("Sorting by title, Z-A")
	must(r.click(".dropdown[data-name='sort-field']"))
	must(r.click(".dropdown-options[data-name='sort-field'] .dropdown-option[data-value='default']"))
	must(r.click(".dropdown[data-name='sort-direction']"))
	must(r.click(".dropdown-options[data-name='sort-direction'] .dropdown-option[data-value='true']"))

	r.logf("Ensuring the Z-A sorting is correct")
	must(r.waitUntilTextExists(firstTitleSelector, "zzz last"))
}

func installAndLaunchGame(r *runner) {
	const testGameName = "111 first"
	const testGameID = 149766

	r.logf("Searching for known game")
	must(r.click(".topbar-item.search"))
	must(r.setValue(".search-modal .search-input", testGameName))

	r.logf("Opening it")
	var gameResultSelector = fmt.Sprintf(".search-modal .search-results .search-result[data-game-id='%d']", testGameID)
	must(r.click(gameResultSelector))

	r.logf("Installing it")
	must(r.click(".webview-action-bar .install-button"))
	must(r.click(".install-popover .upload-button"))
	must(r.click(".install-popover .upload-info .install-button"))

	r.logf("Launching it")
	must(r.click(".webview-action-bar .launch-button"))

	// TODO: fixme
	var mainActionSelector = ".fixme"

	r.logf("Force-closing it")
	must(r.waitUntilTextExists(mainActionSelector, "Running"))
	must(r.click(mainActionSelector))
	must(r.click("#modal-force-close"))

	r.logf("Making sure it's closed")
	must(r.waitUntilTextExists(mainActionSelector, "Launch"))

	r.logf("Switching to downloads window")
	must(r.click("#sidebar a[href='itch://downloads']"))
	r.mustWaitForWindowQuantity(2)

	mainWindowHandle := r.mustGetSingleWindowHandle()
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
