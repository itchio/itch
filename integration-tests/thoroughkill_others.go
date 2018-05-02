//+build !windows

package main

import (
	"log"
	"os/exec"
)

func thoroughKill(cmd *exec.Cmd) {
	var err error

	p := cmd.Process
	log.Printf("[tk] Trying soft kill of pid %d...", p.Pid)
	err = p.Kill()
	if err != nil {
		log.Printf("[tk] Soft kill didn't work: %+v", err)
	} else {
		return
	}
	log.Printf("[tk] That's all we'll try on non-windows")
}
