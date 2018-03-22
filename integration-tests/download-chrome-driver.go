package main

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"runtime"

	"github.com/go-errors/errors"
)

const chromeDriverVersion = "2.37"

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

	if hasChromeDriver {
		r.logf("Found cached copy of chromedriver, using it")
		return nil
	}

	r.logf("Downloading chromedriver %s...", chromeDriverVersion)
	err = os.MkdirAll(driverCache, 0755)
	if err != nil {
		return errors.Wrap(err, 0)
	}

	url := chromeDriverURL()

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

	return nil
}

func chromeDriverURL() string {
	archString := ""
	switch runtime.GOOS {
	case "windows":
		archString = "win32"
	case "darwin":
		archString = "mac64"
	case "linux":
		archString = "linux64"
	}

	return fmt.Sprintf("https://chromedriver.storage.googleapis.com/%s/chromedriver_%s.zip", chromeDriverVersion, archString)
}
