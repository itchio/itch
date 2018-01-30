package main

import (
	"os/exec"
	"runtime"
	"time"
)

func prepareFlow(r *runner) {
	r.logf("logging in with valid credentials")
	must(r.setValue("#login-username", testAccountName))
	must(r.setValue("#login-password", testAccountPassword))
	must(r.click("#login-button"))
	must(r.waitForVisible(".meat-tab.visible .user-menu"))

	butlerExeName := "butler"
	if runtime.GOOS == "windows" {
		butlerExeName += ".exe"
	}

	tries := 6
	sleepTime := 2 * time.Second

	for {
		butlerOutput, err := exec.Command("tmp/prefix/userData/bin/"+butlerExeName, "upgrade", "--head", "--assume-yes").Output()
		if err == nil {
			r.logf("butler upgrade output:\n%s", butlerOutput)
			break
		}

		tries--
		if tries > 0 {
			r.logf("butler upgrade failure, will retry %d more times after sleeping %s: %s", tries, sleepTime, err.Error())
			time.Sleep(sleepTime)
			sleepTime *= 2
			continue
		}
		must(err)
	}
}
