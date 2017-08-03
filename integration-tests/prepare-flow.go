package main

func prepareFlow(r *runner) {
	r.logf("logging in with valid credentials")
	must(r.setValue("#login-username", testAccountName))
	must(r.setValue("#login-password", testAccountPassword))
	must(r.click("#login-button"))
	must(r.waitForVisible("#user-menu"))
}
