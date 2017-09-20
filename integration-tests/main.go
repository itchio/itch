package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	gs "github.com/fasterthanlime/go-selenium"
	"github.com/go-errors/errors"
	"github.com/hpcloud/tail"
	"github.com/onsi/gocleanup"
)

const testAccountName = "itch-test-account"
const chromeDriverVersion = "2.27"

var testAccountPassword = os.Getenv("ITCH_TEST_ACCOUNT_PASSWORD")

type CleanupFunc func()

type runner struct {
	cwd                string
	chromeDriverExe    string
	chromeDriverCmd    *exec.Cmd
	chromeDriverCancel context.CancelFunc
	driver             gs.WebDriver
	prefix             string
	cleanup            CleanupFunc
	testStart          time.Time
}

func (r *runner) logf(format string, args ...interface{}) {
	log.Printf(format, args...)
}

func main() {
	must(doMain())
}

var r *runner

func doMain() error {
	bootTime := time.Now()

	if testAccountPassword == "" {
		return errors.New("password not given via environment, stopping here")
	}

	r = &runner{
		prefix: "tmp",
	}
	must(os.RemoveAll(r.prefix))

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
	env = append(env, "ITCH_LOG_LEVEL=debug")
	env = append(env, "ITCH_NO_STDOUT=1")
	r.chromeDriverCmd.Env = env

	go func() {
		t, err := tail.TailFile(filepath.Join(cwd, r.prefix, "prefix", "userData", "logs", "itch.txt"), tail.Config{
			Follow: true,
			Poll:   true,
		})
		must(err)

		for line := range t.Lines {
			fmt.Println(line.Text)
		}
	}()

	must(r.chromeDriverCmd.Start())

	r.cleanup = func() {
		r.logf("Cleaning up chrome driver...")
		r.driver.CloseWindow()
		chromeDriverCancel()
		r.chromeDriverCmd.Wait()
	}

	defer r.cleanup()
	gocleanup.Register(r.cleanup)

	appPath := cwd
	binaryPathBytes, err := exec.Command("node", "-e", "console.log(require('electron'))").Output()
	binaryPath := strings.TrimSpace(string(binaryPathBytes))

	relativeBinaryPath, err := filepath.Rel(cwd, binaryPath)
	if err != nil {
		relativeBinaryPath = binaryPath
	}
	r.logf("Using electron: %s", relativeBinaryPath)

	// Create capabilities, driver etc.
	capabilities := gs.Capabilities{}
	capabilities.SetBrowser(gs.ChromeBrowser())
	co := capabilities.ChromeOptions()
	co.SetBinary(binaryPath)
	co.SetArgs([]string{
		"app=" + appPath,
	})
	capabilities.SetChromeOptions(co)

	startTime := time.Now()

	driver, err := gs.NewSeleniumWebDriver(fmt.Sprintf("http://127.0.0.1:%d", chromeDriverPort), capabilities)
	if err != nil {
		return errors.Wrap(err, 0)
	}

	r.driver = driver

	_, err = driver.CreateSession()
	if err != nil {
		return errors.Wrap(err, 0)
	}

	r.logf("Hey cool, we're in the app!")
	r.logf("it started in %s", time.Since(startTime))

	r.testStart = time.Now()

	// Delete the session once this function is completed.
	defer driver.DeleteSession()

	prepareFlow(r)
	navigationFlow(r)
	installFlow(r)
	loginFlow(r)

	log.Printf("Succeeded in %s", time.Since(r.testStart))
	log.Printf("Total time %s", time.Since(bootTime))
	return nil
}

func must(err error) {
	if err != nil {
		log.Println("Fatal error:")
		switch err := err.(type) {
		case *errors.Error:
			log.Println(err.ErrorStack())
		default:
			log.Println(err.Error())
		}

		if r != nil {
			log.Printf("Failed in %s", time.Since(r.testStart))

			if r.cleanup != nil {
				r.cleanup()
				os.Exit(1)
			}
		}
	}
}
