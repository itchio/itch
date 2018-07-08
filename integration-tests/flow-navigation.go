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
}
