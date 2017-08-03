package main

import (
	"fmt"

	"github.com/go-errors/errors"
)

func loginFlow(r *runner) {
	logout := func(forReal bool) {
		must(r.click("#user-menu"))
		must(r.click("#user-menu-change-user"))

		if forReal {
			must(r.click("#modal-logout"))
		} else {
			must(r.click("#modal-cancel"))
		}
	}

	r.logf("logging out for real")
	logout(true)

	r.logf("forgetting session")
	must(r.waitForVisible(".remembered-session"))
	must(r.click(".remembered-session .forget-session"))
	must(r.click("#modal-forget-session"))

	r.logf("logging in with invalid credentials")
	must(r.setValue("#login-username", "c93e730d"))
	must(r.setValue("#login-password", "553b6a59"))
	must(r.click("#login-button"))
	must(r.waitUntilTextExists("#login-errors", "Incorrect username or password"))

	if testAccountPassword == "" {
		must(errors.Wrap(fmt.Errorf("No password in environment, not performing further login tests"), 0))
	}

	r.logf("logging in with valid credentials")
	loginWithPassword := func() {
		must(r.setValue("#login-username", testAccountName))
		must(r.setValue("#login-password", testAccountPassword))
		must(r.click("#login-button"))
		must(r.waitForVisible("#user-menu"))
	}
	loginWithPassword()

	// now kids this is the REAL integration testing you've been talked about
	r.logf("checking that we're logged in on itch.io too")

	r.logf("opening new tab")
	must(r.click("#new-tab-icon"))
	must(r.click("input.browser-address"))
	must(r.setValue("input.browser-address", "https://itch.io/login"))
	must(r.click(".meat-tab.visible .go-button"))

	r.logf("checking that we're redirected to the dashboard")
	must(r.waitUntilTextExists(
		".meat-tab.visible .title-bar-text",
		"Creator Dashboard",
	))

	r.logf("now clearing cookies")
	must(r.click("#user-menu"))
	must(r.click("#user-menu-preferences"))

	r.logf("expanding advanced preferences")
	// must(t.safeScroll("#preferences-advanced-section");
	must(r.click("#preferences-advanced-section"))

	r.logf("opening clearing browsing data dialog")
	// must(t.safeScroll("#clear-browsing-data-link");
	must(r.click("#clear-browsing-data-link"))

	r.logf("clearing cookies")
	must(r.click("#clear-cookies-checkbox"))
	must(r.click("#modal-clear-data"))

	r.logf("opening new tab")
	must(r.click("#new-tab-icon"))
	must(r.click("input.browser-address"))
	must(r.setValue("input.browser-address", "https://itch.io/login"))
	must(r.click(".meat-tab.visible .go-button"))

	r.logf("checking that we've landed on the login page")
	must(r.waitUntilTextExists(
		".meat-tab.visible .title-bar-text",
		"Log in",
	))

	r.logf("doing cancelled logout")
	logout(false)
	r.logf("logging out for real")
	logout(true)

	r.logf("logging back in with remembered sessions")
	must(r.click(".remembered-session"))
	must(r.waitForVisible("#user-menu"))

	r.logf("logging out for real")
	logout(true)
}
