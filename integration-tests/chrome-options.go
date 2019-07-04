package main

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	gs "github.com/fasterthanlime/go-selenium"
	"github.com/pkg/errors"
)

type ChromeOptions struct {
	Binary string
	Args   []string
}

func (opts *ChromeOptions) AddArg(arg string) {
	opts.Args = append(opts.Args, arg)
}

func (opts *ChromeOptions) Apply(caps *gs.Capabilities) {
	if opts.Binary == "" {
		panic("binary can't be empty")
	}
	co := gs.NewChromeOptions()
	co.SetBinary(opts.Binary)
	co.SetArgs(opts.Args)
	caps.SetChromeOptions(co)
}

func (r *runner) GetChromeOptions() (*ChromeOptions, error) {
	opts := &ChromeOptions{
		Binary: "",
		Args: []string{
			// cf. https://bugs.chromium.org/p/chromedriver/issues/detail?id=2489
			"--no-sandbox",
			"--disable-dev-shm-usage",
			// cf. https://bugs.chromium.org/p/chromedriver/issues/detail?id=2489#c20
			"--remote-debugging-port=9222",
		},
	}

	binaryPath := os.Getenv("ITCH_INTEGRATION_BINARY_PATH")
	if binaryPath != "" {
		absoluteBinaryPath, err := filepath.Abs(binaryPath)
		if err != nil {
			r.logf("Had problems making binary path absolute:")
			return nil, err
		}

		r.logf("Testing packaged app at %s", absoluteBinaryPath)
		_, err = os.Stat(absoluteBinaryPath)
		if err != nil {
			r.logf("Had problems checking that binary path exists:")
			return nil, err
		}

		opts.Binary = absoluteBinaryPath
		return opts, nil
	}

	if binaryPath == "" {
		r.logf("$ITCH_INTEGRATION_BINARY_PATH is not set.")
		if os.Getenv("CI") != "" {
			r.logf("...and we're on CI, so there's a configuration error. Bailing out.")
			return nil, errors.Errorf("On CI, $ITCH_INTEGRATION_BINARY_PATH must be set to test the packaged application.")
		}
		r.logf("Assuming dev version")
	}

	appPath := r.cwd
	r.logf("Testing local copy of app %s", appPath)

	binaryPathBytes, err := exec.Command("node", "-e", "console.log(require('electron'))").Output()
	if err != nil {
		return nil, errors.WithMessage(err, "while trying to get the path to electron's binary")
	}
	binaryPath = strings.TrimSpace(string(binaryPathBytes))

	relativeBinaryPath, err := filepath.Rel(r.cwd, binaryPath)
	if err != nil {
		relativeBinaryPath = binaryPath
	}
	r.logf("via: %s", relativeBinaryPath)

	opts.Binary = binaryPath
	opts.AddArg("app=" + appPath)

	r.logf("But first, let's bundle all that javascript...")
	err = r.bundle()
	if err != nil {
		return nil, errors.WithMessage(err, "while bundling")
	}
	r.logf("✓ Everything is bundled!")

	return opts, nil
}
