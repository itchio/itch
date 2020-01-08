package main

import "fmt"

func prepareFlow(r *runner) {
	r.logf("Logging in with valid credentials")
	// using workaround so we don't get hit by recaptcha
	must(r.setValue("#login-username", "#api-key"))
	must(r.click("#login-next"))
	must(r.setValue("#login-password", testAccountAPIKey))
	must(r.click("#login-proceed"))
	must(r.waitForVisible(".user-menu"))

	r.mustWaitForWindowQuantity(2)
	var wins = r.mustListWindows()
	for _, win := range wins {
		if win != r.mainWindow {
			r.webviewWindow = win
			break
		}
	}
	if r.webviewWindow == "" {
		must(fmt.Errorf("Could not find webview window"))
	}
}
