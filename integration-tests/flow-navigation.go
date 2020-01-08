package main

const currTab = ".meat-tab.visible "

func navigationFlow(r *runner) {
	must(r.click(".topbar .item[data-target='library']"))

	r.mustSwitchToWebviewWindow()

	r.logf("Navigating to owned games")
	must(r.click(".sidebar .item[data-source='profile']"))

	const firstTitleSelector = currTab + ".gamedesc--title"

	r.logf("Sorting by title, A-Z")
	must(r.click(currTab + ".sortby--title--default"))
	r.logf("Ensuring the A-Z sorting is correct")
	must(r.waitUntilTextExists(firstTitleSelector, "111 first"))

	r.logf("Sorting by title, Z-A")
	must(r.click(currTab + ".sortby--title--reverse"))
	r.logf("Ensuring the Z-A sorting is correct")
	must(r.waitUntilTextExists(firstTitleSelector, "zzz last"))
}
