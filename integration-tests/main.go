package main

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	goselenium "github.com/fasterthanlime/go-selenium"
	"github.com/go-errors/errors"
	"github.com/itchio/butler/comm"
	"github.com/onsi/gocleanup"
)

const chromeDriverVersion = "2.27"

type runner struct {
	cwd                string
	chromeDriverExe    string
	chromeDriverCmd    *exec.Cmd
	chromeDriverCancel context.CancelFunc
}

func (r *runner) logf(format string, args ...interface{}) {
	log.Printf(format, args...)
}

func main() {
	must(doMain())
}

func doMain() error {
	r := &runner{}

	cwd, err := os.Getwd()
	if err != nil {
		return errors.Wrap(err, 0)
	}
	r.cwd = cwd

	must(downloadChromeDriver(r))

	chromeDriverPort := 9515
	chromeDriverLogPath := filepath.Join(cwd, "chrome-driver.log.txt")
	chromeDriverCtx, chromeDriverCancel := context.WithCancel(context.Background())
	r.chromeDriverCmd = exec.CommandContext(chromeDriverCtx, r.chromeDriverExe, fmt.Sprintf("--port=%d", chromeDriverPort), fmt.Sprintf("--log-path=%s", chromeDriverLogPath))
	env := os.Environ()
	env = append(env, "NODE_ENV=test")
	r.chromeDriverCmd.Env = env

	must(r.chromeDriverCmd.Start())

	cleanupChromeDriver := func() {
		r.logf("Cleaning up chrome driver...")
		chromeDriverCancel()
		r.chromeDriverCmd.Wait()
	}

	defer cleanupChromeDriver()
	gocleanup.Register(cleanupChromeDriver)

	appPath := cwd
	binaryPathBytes, err := exec.Command("node", "-e", "console.log(require('electron'))").Output()
	binaryPath := strings.TrimSpace(string(binaryPathBytes))

	relativeBinaryPath, err := filepath.Rel(cwd, binaryPath)
	if err != nil {
		relativeBinaryPath = binaryPath
	}
	r.logf("Using electron: %s", relativeBinaryPath)

	// Create capabilities, driver etc.
	capabilities := goselenium.Capabilities{}
	capabilities.SetBrowser(goselenium.ChromeBrowser())
	co := capabilities.ChromeOptions()
	co.SetBinary(binaryPath)
	co.SetArgs([]string{
		"app=" + appPath,
	})
	capabilities.SetChromeOptions(co)

	startTime := time.Now()

	driver, err := goselenium.NewSeleniumWebDriver(fmt.Sprintf("http://localhost:%d", chromeDriverPort), capabilities)
	if err != nil {
		return errors.Wrap(err, 0)
	}

	_, err = driver.CreateSession()
	if err != nil {
		return errors.Wrap(err, 0)
	}

	// Delete the session once this function is completed.
	defer driver.DeleteSession()

	var el goselenium.Element

	r.logf("Hey cool, we're in the app!")
	r.logf("it started in %s", time.Since(startTime))

	time.Sleep(2 * time.Second)
	r.logf("Navigating to dashboard")
	el, err = driver.FindElement(goselenium.ByCSSSelector("section[data-path=dashboard]"))
	if err != nil {
		return errors.Wrap(err, 0)
	}

	_, err = el.Click()
	if err != nil {
		return errors.Wrap(err, 0)
	}

	time.Sleep(2 * time.Second)
	r.logf("Navigating to library")
	el, err = driver.FindElement(goselenium.ByCSSSelector("section[data-path=library]"))
	if err != nil {
		return errors.Wrap(err, 0)
	}

	_, err = el.Click()
	if err != nil {
		return errors.Wrap(err, 0)
	}

	time.Sleep(1 * time.Second)
	r.logf("Well, bye!")

	return nil
}

func must(err error) {
	if err != nil {
		switch err := err.(type) {
		case *errors.Error:
			comm.Die(err.ErrorStack())
		default:
			comm.Die(err.Error())
		}
	}
}

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
