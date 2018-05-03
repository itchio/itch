package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	gs "github.com/fasterthanlime/go-selenium"
	"github.com/hpcloud/tail"
	"github.com/onsi/gocleanup"
	"github.com/pkg/errors"
)

const stampFormat = "15:04:05.999"

const testAccountName = "itch-test-account"

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
	err := SetupProcessGroup()
	if err != nil {
		return err
	}

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
		return errors.WithStack(err)
	}
	r.cwd = cwd

	must(downloadChromeDriver(r))
	r.logf("✓ ChromeDriver is set up!")

	chromeDriverStartupChan := make(chan bool)

	chromeDriverPort := 9515
	chromeDriverLogPath := filepath.Join(cwd, "chrome-driver.log.txt")
	chromeDriverCtx, chromeDriverCancel := context.WithCancel(context.Background())
	r.chromeDriverCmd = exec.CommandContext(chromeDriverCtx, r.chromeDriverExe, fmt.Sprintf("--port=%d", chromeDriverPort), fmt.Sprintf("--log-path=%s", chromeDriverLogPath))
	cdoutR, cdoutW, err := os.Pipe()
	must(err)
	r.chromeDriverCmd.Stdout = cdoutW
	r.chromeDriverCmd.Stderr = os.Stderr
	env := os.Environ()
	env = append(env, "ITCH_INTEGRATION_TESTS=1")
	env = append(env, "ITCH_LOG_LEVEL=debug")
	env = append(env, "ITCH_NO_STDOUT=1")
	r.chromeDriverCmd.Env = env

	go func() {
		s := bufio.NewScanner(cdoutR)
		for s.Scan() {
			r.logf("[chromedriver] %s", s.Text())
			if strings.Contains(s.Text(), "Only local connections are allowed") {
				close(chromeDriverStartupChan)
			}
		}
	}()

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
	chromeDriverPid := r.chromeDriverCmd.Process.Pid
	r.logf("ChromeDriver lives (for now) as PID %d", chromeDriverPid)

	chromeDriverWaitCh := make(chan error)

	go func() {
		chromeDriverWaitCh <- r.chromeDriverCmd.Wait()
	}()

	r.cleanup = func() {
		r.logf("closing chrome-driver window...")
		r.driver.CloseWindow()
		r.logf("cancelling chrome-driver context...")
		chromeDriverCancel()

		r.logf("waiting on chrome-driver")
		select {
		case err := <-chromeDriverWaitCh:
			if err == nil {
				r.logf("chrome-driver exited with: %+v", err)
			} else {
				r.logf("chrome-driver exited with: %+v", err)
			}
		case <-time.After(15 * time.Second):
			r.logf("well, we gave it 15 seconds, bailing out now")
			gocleanup.Exit(1)
		}
	}

	defer r.cleanup()
	gocleanup.Register(r.cleanup)

	// Create capabilities, driver etc.
	capabilities := gs.Capabilities{}
	capabilities.SetBrowser(gs.ChromeBrowser())
	co := capabilities.ChromeOptions()

	err = r.SetupChromeOptions(co)
	if err != nil {
		return err
	}
	capabilities.SetChromeOptions(co)

	driver, err := gs.NewSeleniumWebDriver(fmt.Sprintf("http://127.0.0.1:%d", chromeDriverPort), capabilities)
	if err != nil {
		return errors.WithStack(err)
	}

	r.driver = driver

	r.logf("Waiting for chrome driver to be fully started")
	select {
	case <-chromeDriverStartupChan:
		r.logf("Chrome driver is actually listening!")
	case <-time.After(2 * time.Second):
		r.logf("Timed out waiting for chrome driver to start listening...")
		gocleanup.Exit(1)
	}

	tryCreateSession := func() error {
		beforeCreateTime := time.Now()
		sessRes, err := driver.CreateSession()
		if err != nil {
			return errors.WithStack(err)
		}

		r.logf("Session %s created in %s", time.Since(beforeCreateTime), sessRes.SessionID)
		r.readyForScreenshot = true

		err = r.takeScreenshot("initial")
		if err != nil {
			r.readyForScreenshot = false
			return errors.WithStack(err)
		}
		return nil
	}

	hasSession := false
	for tries := 1; tries <= 5; tries++ {
		r.logf("Creating a webdriver session (try #%d)", tries)
		err := tryCreateSession()
		if err == nil {
			// oh joy!
			hasSession = true
			break
		}
		r.logf("Could not create a webdriver session: %+v", err)
	}

	if !hasSession {
		r.logf("Could not create a webdriver session :( We tried..")
		gocleanup.Exit(1)
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

func (r *runner) bundle() error {
	r.logf("Bundling...")

	cmd := exec.Command("npm", "run", "compile")
	cmd.Env = os.Environ()
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	err := cmd.Run()
	if err != nil {
		r.errf("Bundling failed: %v", err)
		return errors.WithStack(err)
	}
	return nil
}

func must(err error) {
	if err != nil {
		log.Printf("==================================================================")
		log.Printf("Fatal error: %+v", err)
		log.Printf("==================================================================")

		if r != nil {
			r.errf("Failed in %s", time.Since(r.testStart))

			if r.driver != nil {
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
			}

			gocleanup.Exit(1)
		}
	}
}
