package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/hpcloud/tail"
	gs "github.com/itchio/go-selenium"
	"github.com/logrusorgru/aurora"
	"github.com/onsi/gocleanup"
	"github.com/pkg/errors"
)

const stampFormat = "15:04:05.999"

// Test account name is: itch-test-account
var testAccountAPIKeyEnvVar = "ITCH_TEST_ACCOUNT_API_KEY"
var testAccountAPIKey = os.Getenv(testAccountAPIKeyEnvVar)

type CleanupFunc func()

type runner struct {
	cwd                string
	chromeLogger       *log.Logger
	logger             *log.Logger
	errLogger          *log.Logger
	chromeDriverExe    string
	chromeDriverCmd    *exec.Cmd
	driver             gs.WebDriver
	prefix             string
	cleanup            CleanupFunc
	testStart          time.Time
	readyForScreenshot bool

	mainWindow string
}

func (r *runner) chromelogf(format string, args ...interface{}) {
	r.chromeLogger.Println(aurora.Sprintf(aurora.Green(format), args...))
}

func (r *runner) logf(format string, args ...interface{}) {
	r.logger.Println(aurora.Sprintf(aurora.Blue(format), args...))
}

func (r *runner) errf(format string, args ...interface{}) {
	r.errLogger.Println(aurora.Sprintf(aurora.Red(format), args...))
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
	defer gocleanup.Cleanup()

	err := SetupProcessGroup()
	if err != nil {
		return err
	}

	log.SetFlags(log.Ltime | log.Lmicroseconds)
	bootTime := time.Now()

	if testAccountAPIKey == "" {
		return errors.Errorf("$%s not set, stopping here", testAccountAPIKeyEnvVar)
	}

	r = &runner{
		prefix:       "tmp",
		logger:       log.New(os.Stdout, "=== ", log.Ltime|log.Lmicroseconds),
		chromeLogger: log.New(os.Stdout, "️💻 ", 0),
		errLogger:    log.New(os.Stderr, "❌ ", log.Ltime|log.Lmicroseconds),
		testStart:    time.Now(),
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

	chromeDriverStartupChan := make(chan struct{})

	chromeDriverPort, err := getFreePort()
	must(err)
	r.logf("Picked ChromeDriver port %d", chromeDriverPort)

	chromeDriverLogPath := filepath.Join(cwd, "chrome-driver.log.txt")
	chromeDriverCtx, chromeDriverCancel := context.WithCancel(context.Background())
	r.chromeDriverCmd = exec.CommandContext(chromeDriverCtx, r.chromeDriverExe, fmt.Sprintf("--port=%d", chromeDriverPort), fmt.Sprintf("--log-path=%s", chromeDriverLogPath), "--verbose")
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
			line := s.Text()
			r.chromelogf("%s", line)
			if strings.Contains(line, "ChromeDriver was started successfully") {
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

			// TODO: parse JSON, print in structured format
			ill, err := parseLogLine(line.Text)
			if err != nil {
				r.chromeLogger.Printf("could not parse itch log line: %s", line.Text)
			} else {
				r.chromeLogger.Printf("%s", ill)
			}
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
		r.logf("deleting session")
		if r.driver != nil {
			_, err := r.driver.DeleteSession()
			if err != nil {
				r.logf("could not delete session: %+s", err)
			}
		} else {
			r.logf("no driver yet!")
		}

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

	gocleanup.Register(r.cleanup)

	// Work around https://bugs.chromium.org/p/chromium/issues/detail?id=264818
	os.Setenv("MESA_GLSL_CACHE_DISABLE", "true")

	// Create capabilities, driver etc.
	capabilities := gs.Capabilities{}
	capabilities.SetBrowser(gs.ChromeBrowser())

	chromeOpts, err := r.GetChromeOptions()
	if err != nil {
		return err
	}
	log.Printf("Got chrome options: %#v", chromeOpts)
	chromeOpts.Apply(&capabilities)

	r.logf("Waiting for chrome driver to be fully started")
	select {
	case <-chromeDriverStartupChan:
		r.logf("Chrome driver is actually listening!")
	case <-time.After(2 * time.Second):
		r.logf("Timed out waiting for chrome driver to start listening...")
		gocleanup.Exit(1)
	}

	driver, err := gs.NewSeleniumWebDriver(fmt.Sprintf("http://127.0.0.1:%d", chromeDriverPort), capabilities)
	if err != nil {
		return errors.WithStack(err)
	}

	r.driver = driver

	tryCreateSession := func() error {
		beforeCreateTime := time.Now()
		sessRes, err := driver.CreateSession()
		if err != nil {
			time.Sleep(1 * time.Second)
			return errors.WithStack(err)
		}

		r.logf("Session %s created in %v", sessRes.SessionID, time.Since(beforeCreateTime))

		r.readyForScreenshot = true

		err = r.takeScreenshot("initial")
		if err != nil {
			panic(errors.WithStack(err))
		}

		r.mainWindow = r.mustGetCurrentWindow()

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

	r.logf("Waiting for setup to be done...")
	must(setupWatch.WaitWithTimeout(60 * time.Second))

	allFlows(r)

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

			if os.Getenv("HANG_AFTER_FAIL") == "1" {
				r.logf("HANG_AFTER_FAIL is set, sleeping indefinitely...")
				for {
					time.Sleep(1 * time.Second)
				}
			}

			gocleanup.Exit(1)
		}
	}
}

// getFreePort asks the kernel for a free open port that is ready to use.
func getFreePort() (int, error) {
	addr, err := net.ResolveTCPAddr("tcp", "localhost:0")
	if err != nil {
		return 0, err
	}

	l, err := net.ListenTCP("tcp", addr)
	if err != nil {
		return 0, err
	}
	defer l.Close()
	return l.Addr().(*net.TCPAddr).Port, nil
}
