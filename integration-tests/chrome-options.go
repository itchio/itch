package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	gs "github.com/fasterthanlime/go-selenium"
	"github.com/pkg/errors"
)

func (r *runner) SetupChromeOptions(co gs.ChromeOptions) error {
	binaryPath := os.Getenv("ITCH_INTEGRATION_BINARY_PATH")
	if binaryPath != "" {
		r.logf("Testing packaged app at %s", binaryPath)
		co.SetBinary(binaryPath)
		return nil
	}

	if binaryPath == "" {
		r.logf("$ITCH_INTEGRATION_BINARY_PATH is not set.")
		if os.Getenv("CI") != "" {
			r.logf("...and we're on CI, so there's a configuration error. Bailing out.")
			return errors.Errorf("On CI, $ITCH_INTEGRATION_BINARY_PATH must be set to test the packaged application.")
		}
		r.logf("Assuming dev version")
	}

	appPath := r.cwd
	r.logf("Testing local copy of app %s", appPath)

	binaryPathBytes, err := exec.Command("node", "-e", "console.log(require('electron'))").Output()
	if err != nil {
		return errors.WithMessage(err, "while trying to get the path to electron's binary")
	}
	binaryPath = strings.TrimSpace(string(binaryPathBytes))

	relativeBinaryPath, err := filepath.Rel(r.cwd, binaryPath)
	if err != nil {
		relativeBinaryPath = binaryPath
	}
	r.logf("via: %s", relativeBinaryPath)

	co.SetBinary(binaryPath)
	co.SetArgs([]string{
		"app=" + appPath,
	})

	r.logf("But first, let's bundle all that javascript...")
	err = r.bundle()
	if err != nil {
		return errors.WithMessage(err, "while bundling")
	}
	r.logf("✓ Everything is bundled!")

	return nil
}
