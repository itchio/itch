package main

func prepareFlow(r *runner) {
	r.logf("logging in with valid credentials")
	// click through to password login form (OAuth is shown by default)
	must(r.click("#show-password-login"))
	// using workaround so we don't get hit by recaptcha
	must(r.setValue("#login-username", "#api-key"))
	must(r.setValue("#login-password", testAccountAPIKey))
	must(r.click("#login-button"))
	must(r.waitForVisible(".user-menu"))
}
