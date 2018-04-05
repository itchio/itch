package main

import (
	"compress/gzip"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"time"

	gs "github.com/fasterthanlime/go-selenium"
	"github.com/go-errors/errors"
	"github.com/hpcloud/tail"
	"github.com/onsi/gocleanup"
)

const stampFormat = "15:04:05.999"

const testAccountName = "itch-test-account"
const enableGetButler = false

var testAccountPassword = os.Getenv("ITCH_TEST_ACCOUNT_PASSWORD")
var testAccountAPIKey = os.Getenv("ITCH_TEST_ACCOUNT_API_KEY")

type CleanupFunc func()

type runner struct {
	cwd                string
	logger             *log.Logger
	errLogger          *log.Logger
	chromeDriverExe    string
	chromeDriverCmd    *exec.Cmd
	driver             gs.WebDriver
	prefix             string
	cleanup            CleanupFunc
	testStart          time.Time
	readyForScreenshot bool
}

func (r *runner) logf(format string, args ...interface{}) {
	r.logger.Printf(format, args...)
}

func (r *runner) errf(format string, args ...interface{}) {
	r.errLogger.Printf(format, args...)
}

func main() {
	must(doMain())
}

var r *runner

type logWatch struct {
	re *regexp.Regexp
	c  chan bool
}

func (lw *logWatch) WaitWithTimeout(timeout time.Duration) error {
	select {
	case <-lw.c:
		r.logf("Saw pattern (%s)", lw.re.String())
		return nil
	case <-time.After(timeout):
		return errors.Errorf("Timed out after %s waiting for pattern (%s)", timeout, lw.re.String())
	}
}

func doMain() error {
	log.SetFlags(log.Ltime | log.Lmicroseconds)
	bootTime := time.Now()

	if testAccountAPIKey == "" {
		return errors.New("API key not given via environment, stopping here")
	}

	r = &runner{
		prefix:    "tmp",
		logger:    log.New(os.Stdout, "• ", log.Ltime|log.Lmicroseconds),
		errLogger: log.New(os.Stderr, "❌ ", log.Ltime|log.Lmicroseconds),
	}
	must(os.RemoveAll(r.prefix))
	must(os.RemoveAll("screenshots"))

	cwd, err := os.Getwd()
	if err != nil {
		return errors.Wrap(err, 0)
	}
	r.cwd = cwd

	done := make(chan error)

	numPrepTasks := 0
	if enableGetButler {
		numPrepTasks++
		go func() {
			done <- r.getButler()
			r.logf("✓ Butler is all set up!")
		}()
	}

	numPrepTasks++
	go func() {
		done <- downloadChromeDriver(r)
		r.logf("✓ ChromeDriver is set up!")
	}()

	numPrepTasks++
	go func() {
		done <- r.bundle()
		r.logf("✓ Everything is bundled!")
	}()

	for i := 0; i < numPrepTasks; i++ {
		must(<-done)
	}

	chromeDriverPort := 9515
	chromeDriverLogPath := filepath.Join(cwd, "chrome-driver.log.txt")
	chromeDriverCtx, chromeDriverCancel := context.WithCancel(context.Background())
	r.chromeDriverCmd = exec.CommandContext(chromeDriverCtx, r.chromeDriverExe, fmt.Sprintf("--port=%d", chromeDriverPort), fmt.Sprintf("--log-path=%s", chromeDriverLogPath))
	env := os.Environ()
	env = append(env, "NODE_ENV=test")
	env = append(env, "ITCH_LOG_LEVEL=debug")
	env = append(env, "ITCH_NO_STDOUT=1")
	env = append(env, "ELECTRON_ENABLE_LOGGING=1")
	r.chromeDriverCmd.Env = env

	var logWatches []*logWatch

	makeLogWatch := func(re *regexp.Regexp) *logWatch {
		lw := &logWatch{
			re: re,
			c:  make(chan bool, 1),
		}
		logWatches = append(logWatches, lw)
		return lw
	}

	setupWatch := makeLogWatch(regexp.MustCompile("Setup done"))

	go func() {
		logger := log.New(os.Stdout, "★ ", 0)

		t, err := tail.TailFile(filepath.Join(cwd, r.prefix, "prefix", "userData", "logs", "itch.txt"), tail.Config{
			Follow: true,
			Poll:   true,
			Logger: tail.DiscardingLogger,
		})
		must(err)

		for line := range t.Lines {
			for i, lw := range logWatches {
				if lw.re.MatchString(line.Text) {
					lw.c <- true
					copy(logWatches[i:], logWatches[i+1:])
					logWatches[len(logWatches)-1] = nil
					logWatches = logWatches[:len(logWatches)-1]
				}
			}
			logger.Print(line.Text)
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
	if err != nil {
		return errors.Wrap(err, 0)
	}
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

	sessRes, err := driver.CreateSession()
	if err != nil {
		return errors.Wrap(err, 0)
	}

	r.logf("We're talking to the app! (started in %s)", time.Since(startTime))
	r.logf("Session ID: %s", sessRes.SessionID)
	r.readyForScreenshot = true

	r.logf("Taking screenshot")
	err = r.takeScreenshot("initial")
	if err != nil {
		r.errf("Could not take screenshot: %s", err.Error())
	}

	// Delete the session once this function is completed.
	defer driver.DeleteSession()

	r.logf("Waiting for setup to be done...")
	must(setupWatch.WaitWithTimeout(60 * time.Second))
	r.testStart = time.Now()

	prepareFlow(r)
	navigationFlow(r)
	installFlow(r)
	loginFlow(r)

	r.logf("Succeeded in %s", time.Since(r.testStart))
	r.logf("Total time %s", time.Since(bootTime))

	r.logf("Taking final screenshot")
	err = r.takeScreenshot("final")
	if err != nil {
		r.errf("Could not take final screenshot: %s", err.Error())
	}

	return nil
}

func (r *runner) getButler() error {
	ext := ""
	if runtime.GOOS == "windows" {
		ext = ".exe"
	}
	butlerDest := filepath.Join(r.cwd, "tmp", "prefix", "userData", "broth", "butler", "versions", "9999.0.0", "butler"+ext)
	err := os.MkdirAll(filepath.Dir(butlerDest), 0755)
	if err != nil {
		return errors.Wrap(err, 0)
	}
	butlerFile, err := os.Create(butlerDest)
	if err != nil {
		return errors.Wrap(err, 0)
	}
	defer func() {
		must(butlerFile.Close())
		must(os.Chmod(butlerDest, 0755))
	}()

	if _, ok := os.LookupEnv("CI"); !ok {
		r.logf("Looking for local butler")
		butlerSrc, err := exec.LookPath("butler" + ext)
		if err != nil {
			return errors.Wrap(err, 0)
		}
		r.logf("Copying local butler from (%s)", butlerSrc)
		r.logf("to (%s)", butlerDest)

		butlerSrcFile, err := os.Open(butlerSrc)
		if err != nil {
			return errors.Wrap(err, 0)
		}
		defer butlerSrcFile.Close()

		_, err = io.Copy(butlerFile, butlerSrcFile)
		if err != nil {
			return errors.Wrap(err, 0)
		}

		return nil
	}

	r.logf("Downloading butler")
	butlerURL := fmt.Sprintf("https://dl.itch.ovh/butler/%s-%s/head/butler.gz", runtime.GOOS, runtime.GOARCH)

	req, err := http.Get(butlerURL)
	if err != nil {
		return errors.Wrap(err, 0)
	}

	gunzipper, err := gzip.NewReader(req.Body)
	if err != nil {
		return errors.Wrap(err, 0)
	}

	_, err = io.Copy(butlerFile, gunzipper)
	if err != nil {
		return errors.Wrap(err, 0)
	}
	return nil
}

func (r *runner) bundle() error {
	r.logf("Bundling...")

	cmd := exec.Command("node", "./src/init.js")
	cmd.Env = os.Environ()
	cmd.Env = append(cmd.Env, "NODE_ENV=test")
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	if err != nil {
		r.errf("Bundling failed: %v", err)
		return errors.Wrap(err, 0)
	}
	return nil
}

func must(err error) {
	if err != nil {
		fmt.Println("==================================================================")
		fmt.Println("Fatal error:")
		switch err := err.(type) {
		case *errors.Error:
			fmt.Println(err.ErrorStack())
		default:
			fmt.Println(err.Error())
		}
		fmt.Println("==================================================================")

		if r != nil {
			r.errf("Failed in %s", time.Since(r.testStart))

			logRes, logErr := r.driver.Log("browser")
			if logErr == nil {
				r.logf("Browser log:")
				for _, entry := range logRes.Entries {
					stamp := time.Unix(int64(entry.Timestamp/1000.0), 0).Format(stampFormat)
					fmt.Printf("♪ %s %s %s\n", stamp, entry.Level, strings.Replace(entry.Message, "\\n", "\n", -1))
				}
			} else {
				r.errf("Could not get browser log: %s", logErr.Error())
			}

			r.logf("Taking failure screenshot...")
			screenErr := r.takeScreenshot(err.Error())
			if screenErr != nil {
				r.errf("Could not take failure screenshot: %s", screenErr.Error())
			}

			if r.cleanup != nil {
				r.cleanup()
				os.Exit(1)
			}
		}
	}
}
