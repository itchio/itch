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

	// itch://preferences and itch://applog open secondary windows when
	// navigated to (see opensInWindow); the address bar evolves the
	// current tab instead, so use it to render those pages in-tab.
	r.logf("navigating to preferences via the address bar")
	must(r.click(currTab + ".browser-address"))
	must(r.setValue(currTab+"input.browser-address", "itch://preferences\uE007"))
	must(r.waitUntilTextExists(currTab+"#preferences-advanced-section", "Advanced"))
	r.takeScreenshot("preferences page")

	// the preferences page has no address bar; hop back to the dashboard
	r.logf("navigating to the new tab page")
	must(r.click("#sidebar a[href='itch://dashboard']"))
	must(r.click(currTab + ".browser-address"))
	must(r.setValue(currTab+"input.browser-address", "itch://new-tab\uE007"))
	must(r.waitUntilTextExists(currTab+"h2", "Try one of these:"))
	r.takeScreenshot("new tab page")

	r.logf("navigating to the app log")
	must(r.click(currTab + ".browser-address"))
	must(r.setValue(currTab+"input.browser-address", "itch://applog\uE007"))
	must(r.waitForVisible(currTab + ".msgcol"))
	r.takeScreenshot("app log page")
}
