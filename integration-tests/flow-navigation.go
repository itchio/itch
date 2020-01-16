package main

func navigationFlow(r *runner) {
	must(r.click(".topbar .item[data-target='library']"))

	r.mustSwitchToWebviewWindow()

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
