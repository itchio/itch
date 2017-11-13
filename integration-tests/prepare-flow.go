package main

import (
	"os/exec"
	"time"
)

func prepareFlow(r *runner) {
	r.logf("logging in with valid credentials")
	must(r.setValue("#login-username", testAccountName))
	must(r.setValue("#login-password", testAccountPassword))
	must(r.click("#login-button"))
	must(r.waitForVisible("#user-menu"))

	tries := 5
	for {
		butlerOutput, err := exec.Command("tmp/prefix/userData/bin/butler.exe", "upgrade", "--head", "--assume-yes").Output()
		if err == nil {
			r.logf("butler upgrade output:\n%s", butlerOutput)
			break
		}

		tries--
		if tries > 0 {
			r.logf("butler upgrade failure, will retry %d more times: %s", tries, err.Error())
			time.Sleep(2 * time.Second)
			continue
		}
		must(err)
	}
}
