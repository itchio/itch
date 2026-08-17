package main

const currTab = ".meat-tab.visible "

func navigationFlow(r *runner) {
	must(r.waitForVisible(".user-menu"))

	r.logf("navigating to dashboard")
	must(r.click("#sidebar a[href='itch://dashboard']"))

	const firstTitleSelector = currTab + ".gamedesc--title"

	r.logf("sorting by title, A-Z")
	must(r.click(currTab + ".sortby--title--default"))
	r.logf("ensuring the A-Z sorting is correct")
	must(r.waitUntilTextExists(firstTitleSelector, "111 first"))

	r.logf("sorting by title, Z-A")
	must(r.click(currTab + ".sortby--title--reverse"))
	r.logf("ensuring the Z-A sorting is correct")
	must(r.waitUntilTextExists(firstTitleSelector, "zzz last"))

	r.logf("navigating to uploads")
	must(r.click("#sidebar a[href='itch://upload']"))
	must(r.waitUntilTextExists(currTab+".upload-title", "Builds"))

	r.logf("waiting for build totals to load")
	must(r.waitUntilTextExists(currTab+".upload-subtitle", "builds across"))

	r.takeScreenshot("uploads page")

	r.logf("navigating to collections")
	must(r.click("#sidebar a[href='itch://collections']"))
	// .series--itemlist alone would match the dashboard tab we're leaving
	must(r.waitForVisible(currTab + ".collections-page .series--itemlist"))
	r.takeScreenshot("collections page")

	r.logf("navigating to preferences")
	must(r.click("#sidebar a[href='itch://preferences']"))
	must(r.waitUntilTextExists(currTab+"#preferences-advanced-section", "Advanced"))
	r.takeScreenshot("preferences page")

	r.logf("opening the app log from preferences")
	must(r.click(currTab + "#open-app-log-link"))
	must(r.waitForVisible(currTab + ".msgcol"))
	r.takeScreenshot("app log page")

	r.logf("opening a new tab")
	must(r.click("#new-tab-icon"))
	must(r.waitUntilTextExists(currTab+"h2", "Try one of these:"))
	r.takeScreenshot("new tab page")
}
