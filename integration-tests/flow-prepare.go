package main

func prepareFlow(r *runner) {
	r.logf("logging in with valid credentials")
	// using workaround so we don't get hit by recaptcha
	must(r.setValue("#login-username", "#api-key"))
	must(r.click("#login-next"))
	must(r.setValue("#login-password", testAccountAPIKey))
	must(r.click("#login-proceed"))
	must(r.waitForVisible(".user-menu"))
}
