//+build windows

package main

import (
	"log"
	"os/exec"
	"syscall"
	"time"

	"github.com/mitchellh/go-ps"
)

func thoroughKill(cmd *exec.Cmd) {
	var err error

	p := cmd.Process
	log.Printf("[tk] Trying soft kill of pid %d...", p.Pid)
	err = p.Kill()
	if err != nil {
		log.Printf("[tk] Soft kill didn't work: %+v", err)
	}

	for tries := 5; tries > 0; tries-- {
		log.Printf("[tk] Trying to see if process still exists (%d tries remain)", tries)
		pp, err := ps.FindProcess(p.Pid)
		if err != nil {
			log.Printf("[tk] Could not find process (%v), could it be gone?", err)
			return
		}

		log.Printf("[tk] The process still exists (%s)", pp.Executable())
		p.Signal(syscall.SIGKILL)
		time.Sleep(1 * time.Second)
	}
	log.Printf("[tk] Giving up, we've been defeated")
}
