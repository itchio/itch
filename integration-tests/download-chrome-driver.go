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

	"github.com/pkg/errors"
)

func downloadChromeDriver(r *runner) error {
	driverCache := filepath.Join(r.cwd, ".chromedriver")
	ext := ".exe"
	if runtime.GOOS != "windows" {
		ext = ""
	}

	driverExe := filepath.Join(driverCache, "chromedriver"+ext)
	r.chromeDriverExe = driverExe

	getChromeDriverVersion := func() (string, error) {
		out, err := exec.Command(driverExe, "--version").CombinedOutput()
		if err != nil {
			return "", errors.WithMessage(err, "getting chromedriver version")
		}
		return strings.TrimSpace(string(out)), nil
	}

	currentVersion, err := getChromeDriverVersion()
	if err == nil {
		if currentVersion == electronChromeDriverVersionString {
			r.logf("Good version found, keeping it: %s", currentVersion)
			return nil
		} else {
			r.logf("Found (%s) but expected (%s)", currentVersion, electronChromeDriverVersion)
		}
	} else {
		r.logf("No chrome driver version found")
	}

	err = os.RemoveAll(driverCache)
	if err != nil {
		return errors.WithMessage(err, "removing webdriver cache")
	}

	r.logf("Downloading chromedriver...")
	err = os.MkdirAll(driverCache, 0755)
	if err != nil {
		return errors.WithMessage(err, "making chromedriver cache")
	}

	url := chromeDriverURL(r)
	r.logf("Downloading from %s", url)

	req, err := http.Get(url)
	if err != nil {
		return errors.WithMessage(err, "downloading chrome driver")
	}

	if req.StatusCode != 200 {
		err = fmt.Errorf("Got HTTP %d when trying to download %s", req.StatusCode, url)
		return err
	}

	defer req.Body.Close()

	buf, err := ioutil.ReadAll(req.Body)
	if err != nil {
		return errors.WithMessage(err, "downloading chromedriver")
	}

	r.logf("Extracting chromedriver...")
	zf, err := zip.NewReader(bytes.NewReader(buf), int64(len(buf)))
	if err != nil {
		return errors.WithMessage(err, "opening chromedriver zip")
	}

	for _, f := range zf.File {
		err = func(f *zip.File) error {
			r, err := f.Open()
			if err != nil {
				return errors.WithMessage(err, "opening entry in chromedriver zip")
			}
			defer r.Close()

			name := filepath.Join(driverCache, f.Name)
			mode := f.FileInfo().Mode()
			flags := os.O_WRONLY | os.O_CREATE | os.O_TRUNC
			w, err := os.OpenFile(name, flags, mode)
			if err != nil {
				return errors.WithMessage(err, "creating chromedriver entry file")
			}
			defer w.Close()

			_, err = io.Copy(w, r)
			if err != nil {
				return errors.WithMessage(err, "writing chromedriver entry file")
			}

			return nil
		}(f)

		if err != nil {
			return errors.WithStack(err)
		}
	}

	currentVersion, err = getChromeDriverVersion()
	must(err)
	r.logf("%s", currentVersion)

	return nil
}

// not all electron releases have an associated chromedriver
// build. oh joy!
const electronChromeDriverVersion = "v2.0.0-beta.7"
const electronChromeDriverVersionString = "ChromeDriver 2.30 (7accc8730b0f99b5e7c0702ea89d1fa7c17bfe33)"

func chromeDriverURL(r *runner) string {
	tag := electronChromeDriverVersion

	os := ""
	arch := ""
	switch runtime.GOOS {
	case "windows":
		os = "win32"
		arch = "ia32"
	case "darwin":
		os = "darwin"
		arch = "x64"
	case "linux":
		os = "linux"
		arch = "x64"
	}

	dl := "https://github.com/electron/electron/releases/download"
	return fmt.Sprintf("%s/%s/chromedriver-%s-%s-%s.zip", dl, tag, tag, os, arch)
}
