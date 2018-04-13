package main

import (
	"github.com/pkg/errors"
)

func loginFlow(r *runner) {
	logout := func(forReal bool) {
		must(r.click(".user-menu"))
		must(r.click("#user-menu-change-user"))

		if forReal {
			must(r.click("#modal-logout"))
		} else {
			must(r.click("#modal-cancel"))
		}
	}

	r.logf("closing all tabs")
	must(r.click("#sidebar-close-all-tabs"))

	r.logf("logging out for real")
	logout(true)

	r.logf("forgetting profile")
	must(r.waitForVisible(".remembered-profile"))
	must(r.click(".remembered-profile .forget-profile"))
	must(r.click("#modal-forget-profile"))

	// we cannot, as recaptcha hits us
	canUsePasswords := false

	if canUsePasswords {
		r.logf("logging in with invalid credentials")
		must(r.setValue("#login-username", "c93e730d"))
		must(r.setValue("#login-password", "553b6a59"))
		must(r.click("#login-button"))
		must(r.waitUntilTextExists("#login-errors", "Incorrect username or password"))

		if testAccountPassword == "" {
			must(errors.Errorf("No password in environment, not performing further login tests"))
		}

		r.logf("logging in with valid credentials")
		loginWithPassword := func() {
			must(r.setValue("#login-username", testAccountName))
			must(r.setValue("#login-password", testAccountPassword))
			must(r.click("#login-button"))
			must(r.waitForVisible(".user-menu"))
		}
		loginWithPassword()

		// now kids this is the REAL integration testing you've been talked about
		r.logf("checking that we're logged in on itch.io too")

		r.logf("opening new tab")
		must(r.click("#new-tab-icon"))
		must(r.click(".meat-tab.visible .browser-address"))
		must(r.setValue(".meat-tab.visible .browser-address", "https://itch.io/login\uE007"))

		r.logf("checking that we're redirected to the dashboard")
		must(r.waitUntilTextExists(
			".title-bar-text",
			"Creator Dashboard",
		))
	} else {
		r.logf("logging in with valid credentials")
		loginWithPassword := func() {
			must(r.setValue("#login-username", "#api-key"))
			must(r.setValue("#login-password", testAccountAPIKey))
			must(r.click("#login-button"))
			must(r.waitForVisible(".user-menu"))
		}
		loginWithPassword()
	}

	// this is kinda pointless if we can't use passwords
	r.logf("now clearing cookies")
	must(r.click(".user-menu"))
	must(r.click("#user-menu-preferences"))

	r.logf("expanding advanced preferences")
	must(r.click("#preferences-advanced-section"))

	r.logf("opening clearing browsing data dialog")
	must(r.click("#clear-browsing-data-link"))

	r.logf("clearing cookies")
	must(r.click("#clear-cookies-checkbox"))
	must(r.click("#modal-clear-data"))

	r.takeScreenshot("clearing cookies")

	r.logf("opening new tab")
	must(r.click("#new-tab-icon"))
	must(r.click("input.browser-address"))
	must(r.setValue("input.browser-address", "https://itch.io/login\uE007"))

	r.logf("checking that we've landed on the login page")
	must(r.waitUntilTextExists(
		".title-bar-text",
		"Log in",
	))

	r.logf("opening downloads tab")
	must(r.click(".user-menu"))
	must(r.click("#user-menu-downloads"))
	must(r.waitUntilTextExists(".title-bar-text", "Downloads"))

	r.logf("doing cancelled logout")
	logout(false)
	r.logf("logging out for real")
	logout(true)

	r.logf("logging back in with remembered profile")
	must(r.click(".remembered-profile"))
	r.takeScreenshot("viewing remembered profiles")
	must(r.waitForVisible(".user-menu"))

	r.logf("making sure preferences tab was restored")
	must(r.waitForVisible("#sidebar section[data-url='itch://preferences']"))
	r.logf("making sure downloads tab was restored and is currently visible")
	must(r.waitUntilTextExists(".title-bar-text", "Downloads"))

	r.logf("logging out for real")
	logout(true)
}
