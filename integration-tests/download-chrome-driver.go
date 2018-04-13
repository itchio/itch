package main

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"github.com/go-errors/errors"
)

const chromeDriverVersion = "v2.0.0-beta.7"

func downloadChromeDriver(r *runner) error {
	driverCache := filepath.Join(r.cwd, ".chromedriver")
	ext := ".exe"
	if runtime.GOOS != "windows" {
		ext = ""
	}
	driverExe := filepath.Join(driverCache, "chromedriver"+ext)
	r.chromeDriverExe = driverExe

	hasChromeDriver := true

	_, err := os.Lstat(driverExe)
	if err != nil {
		if os.IsNotExist(err) {
			hasChromeDriver = false
		} else {
			return errors.Wrap(err, 0)
		}
	}

	showChromeDriverVersion := func() error {
		out, err := exec.Command(driverExe, "--version").CombinedOutput()
		if err != nil {
			return errors.Wrap(err, 0)
		}
		r.logf("%s", strings.TrimSpace(string(out)))
		return nil
	}

	if hasChromeDriver {
		r.logf("Found cached copy of chromedriver, using it")
		must(showChromeDriverVersion())
		return nil
	}

	r.logf("Downloading chromedriver %s...", chromeDriverVersion)
	err = os.MkdirAll(driverCache, 0755)
	if err != nil {
		return errors.Wrap(err, 0)
	}

	url := chromeDriverURL()
	r.logf("Downloading from %s", url)

	req, err := http.Get(url)
	if err != nil {
		return errors.Wrap(err, 0)
	}

	if req.StatusCode != 200 {
		err = fmt.Errorf("Got HTTP %d when trying to download %s", req.StatusCode, url)
		return err
	}

	defer req.Body.Close()

	buf, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return errors.Wrap(err, 0)
	}

	r.logf("Extracting chromedriver...")
	zf, err := zip.NewReader(bytes.NewReader(buf), int64(len(buf)))
	if err != nil {
		return errors.Wrap(err, 0)
	}

	for _, f := range zf.File {
		err = func(f *zip.File) error {
			r, err := f.Open()
			if err != nil {
				return errors.Wrap(err, 0)
			}
			defer r.Close()

			name := filepath.Join(driverCache, f.Name)
			mode := f.FileInfo().Mode()
			flags := os.O_WRONLY | os.O_CREATE | os.O_TRUNC
			w, err := os.OpenFile(name, flags, mode)
			if err != nil {
				return errors.Wrap(err, 0)
			}
			defer w.Close()

			_, err = io.Copy(w, r)
			if err != nil {
				return errors.Wrap(err, 0)
			}

			return nil
		}(f)

		if err != nil {
			return errors.Wrap(err, 0)
		}
	}
	must(showChromeDriverVersion())

	return nil
}

func chromeDriverURL() string {
	osString := ""
	archString := ""
	switch runtime.GOOS {
	case "windows":
		osString = "win32"
		archString = "ia32"
	case "darwin":
		osString = "darwin"
		archString = "x64"
	case "linux":
		osString = "linux"
		archString = "x64"
	}

	return fmt.Sprintf("https://github.com/electron/electron/releases/download/%s/chromedriver-%s-%s-%s.zip", chromeDriverVersion, chromeDriverVersion, osString, archString)
}
