package main

func loginFlow(r *runner) {
	mainWindowHandle := r.mustGetSingleWindowHandle()
	r.mustCloseAllOtherWindows()

	logout := func(forReal bool) {
		must(r.click(".user-menu"))
		must(r.click("#user-menu-change-user"))

		if forReal {
			must(r.click("#modal-logout"))
		} else {
			must(r.click("#modal-cancel"))
		}
	}

	r.logf("logging out for real")
	logout(true)

	r.logf("forgetting profile")
	must(r.waitForVisible(".remembered-profile"))
	must(r.click(".remembered-profile .forget-profile"))
	must(r.click("#modal-forget-profile"))

	r.logf("logging in with valid credentials")
	loginWithPassword := func() {
		must(r.setValue("#login-username", "#api-key"))
		must(r.setValue("#login-password", testAccountAPIKey))
		must(r.click("#login-button"))
		must(r.waitForVisible(".user-menu"))
	}
	loginWithPassword()

	// this is kinda pointless if we can't use passwords
	r.logf("now clearing cookies")
	must(r.click("#sidebar a[href='itch://preferences']"))

	r.mustWaitForWindowQuantity(2)
	r.mustSwitchToOtherWindow(mainWindowHandle)

	r.logf("opening clearing browsing data dialog")
	must(r.click("#clear-browsing-data-link"))

	r.logf("clearing cookies")
	must(r.click("#clear-cookies-checkbox"))
	must(r.click("#modal-clear-data"))

	r.takeScreenshot("clearing cookies")

	r.mustCloseCurrentWindowAndSwitchTo(mainWindowHandle)

	r.logf("opening itch.io login page")
	must(r.click(".browser-address"))
	must(r.setValue(".browser-address", "https://itch.io/login\uE007"))

	r.logf("checking that we've landed on the login page")
	must(r.waitUntilTextExists(
		".title-bar-text",
		"Log in",
	))

	r.logf("doing cancelled logout")
	logout(false)
	r.logf("logging out for real")
	logout(true)

	r.logf("logging back in with remembered profile")
	must(r.click(".remembered-profile"))
	r.takeScreenshot("viewing remembered profiles")
	must(r.waitForVisible(".user-menu"))

	r.logf("making sure last tab was restored")
	must(r.waitUntilTextExists(
		".title-bar-text",
		"Log in",
	))

	r.logf("logging out for real")
	logout(true)
}
