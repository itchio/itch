package main

import (
	"context"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	gs "github.com/itchio/go-selenium"
	"github.com/pkg/errors"
)

// SLEEP is the amount of time the driver will sleep between each
// attempt at checking that something we're waiting for has happened
const SLEEP = 100 * time.Millisecond

// TIMEOUT is the total amount of time we're willing to wait until
// something happens
const TIMEOUT = 15 * time.Second

// LOG_PERF can be set to true if one wants to log all requests
const LOG_PERF = false

func (r *runner) setValue(selector string, value string) error {
	if LOG_PERF {
		startTime := time.Now()
		defer func() {
			log.Printf("setValue ran in %s", time.Since(startTime))
		}()
	}

	d := r.driver

	err := r.waitForVisible(selector)
	if err != nil {
		return errors.WithStack(err)
	}

	by := gs.ByCSSSelector(selector)
	el, err := d.FindElement(by)
	if err != nil {
		return errors.WithStack(err)
	}

	_, err = el.Clear()
	if err != nil {
		return errors.WithStack(err)
	}

	_, err = el.SendKeys(value)
	if err != nil {
		return errors.WithStack(err)
	}

	return nil
}

func (r *runner) click(selector string) error {
	if LOG_PERF {
		startTime := time.Now()
		defer func() {
			log.Printf("click ran in %s", time.Since(startTime))
		}()
	}

	return r.clickWithTimeout(selector, TIMEOUT)
}

func (r *runner) clickWithTimeout(selector string, timeout time.Duration) error {
	if LOG_PERF {
		startTime := time.Now()
		defer func() {
			log.Printf("clickWithTimeout ran in %s", time.Since(startTime))
		}()
	}

	d := r.driver

	err := r.waitForVisibleWithTimeout(selector, timeout)
	if err != nil {
		return errors.WithStack(err)
	}

	by := gs.ByCSSSelector(selector)
	el, err := d.FindElement(by)
	if err != nil {
		return errors.WithStack(err)
	}

	_, err = el.Click()
	if err != nil {
		return errors.WithStack(err)
	}

	return nil
}

func (r *runner) moveTo(selector string) error {
	if LOG_PERF {
		startTime := time.Now()
		defer func() {
			log.Printf("moveTo ran in %s", time.Since(startTime))
		}()
	}

	d := r.driver

	err := r.waitForVisible(selector)
	if err != nil {
		return errors.WithStack(err)
	}

	by := gs.ByCSSSelector(selector)
	el, err := d.FindElement(by)
	if err != nil {
		return errors.WithStack(err)
	}

	_, err = el.MoveTo(0, 0)
	if err != nil {
		return errors.WithStack(err)
	}

	return nil
}

func (r *runner) waitUntilTextExists(selector string, value string) error {
	if LOG_PERF {
		startTime := time.Now()
		defer func() {
			log.Printf("waitUntilTextExists ran in %s", time.Since(startTime))
		}()
	}

	return r.waitUntilTextExistsWithTimeout(selector, value, TIMEOUT)
}

func (r *runner) waitUntilTextExistsWithTimeout(selector string, value string, timeout time.Duration) error {
	if LOG_PERF {
		startTime := time.Now()
		defer func() {
			log.Printf("waitUntilTextExistsWithTimeout ran in %s", time.Since(startTime))
		}()
	}

	d := r.driver

	err := r.waitForVisible(selector)
	if err != nil {
		return errors.WithStack(err)
	}

	by := gs.ByCSSSelector(selector)
	found := d.Wait(func(w gs.WebDriver) bool {
		el, err := w.FindElement(by)
		if err != nil {
			return false
		}

		text, err := el.Text()
		if err != nil {
			return false
		}

		return strings.Contains(text.Text, value)
	}, timeout, SLEEP)
	if !found {
		return errors.Errorf("timed out waiting for %s to have text '%s'", selector, value)
	}

	return nil
}

func (r *runner) waitForVisible(selector string) error {
	if LOG_PERF {
		startTime := time.Now()
		defer func() {
			log.Printf("waitForVisible ran in %s", time.Since(startTime))
		}()
	}

	return r.waitForVisibleWithTimeout(selector, TIMEOUT)
}

func (r *runner) waitForVisibleWithTimeout(selector string, timeout time.Duration) error {
	if LOG_PERF {
		startTime := time.Now()
		defer func() {
			log.Printf("waitForVisibleWithTimeout ran in %s", time.Since(startTime))
		}()
	}

	d := r.driver

	by := gs.ByCSSSelector(selector)

	found := d.Wait(func(w gs.WebDriver) bool {
		el, err := w.FindElement(by)
		if err != nil {
			return false
		}

		res, err := el.Displayed()
		if err != nil {
			return false
		}

		return res.Displayed
	}, timeout, SLEEP)

	if !found {
		return errors.Errorf("timed out waiting for %s to be visible", selector)
	}

	return nil
}

func (r *runner) mustGetSingleWindowHandle() string {
	handles := r.mustListWindows()
	if len(handles) != 1 {
		must(errors.Errorf("Expected exactly 1 windows but got %d: %s",
			len(handles),
			strings.Join(handles, ", "),
		))
	}
	return handles[0]
}

func (r *runner) mustWaitForWindowQuantity(quantity int) {
	actualQuantity := 0

	success := r.driver.Wait(func(d gs.WebDriver) bool {
		res, err := d.WindowHandles()
		if err != nil {
			return false
		}

		actualQuantity = len(res.Handles)
		return actualQuantity == quantity
	}, TIMEOUT, SLEEP)

	if !success {
		must(errors.Errorf("Expected %d windows to exist, but had %d", quantity, actualQuantity))
	}
}

func (r *runner) mustGetCurrentWindow() string {
	res, err := r.driver.WindowHandle()
	must(err)

	return res.Handle
}

func (r *runner) mustListWindows() []string {
	res, err := r.driver.WindowHandles()
	must(err)

	r.logf("Listed windows: %s", strings.Join(res.Handles, ", "))
	return res.Handles
}

func (r *runner) mustSwitchToOtherWindow(handle string) {
	handles := r.mustListWindows()
	for _, h := range handles {
		if h != handle {
			r.mustSwitchToWindow(h)
			return
		}
	}
	must(errors.Errorf("Tried to switch to window other than (%s) but only found: %s",
		handle,
		strings.Join(handles, ", "),
	))
}

func (r *runner) mustCloseCurrentWindowAndSwitchTo(handle string) {
	_, err := r.driver.CloseWindow()
	must(err)

	r.mustSwitchToWindow(handle)
}

func (r *runner) mustCloseAllOtherWindows() {
	handle := r.mustGetCurrentWindow()

	handles := r.mustListWindows()
	for _, h := range handles {
		if h != handle {
			r.mustSwitchToWindow(h)
			r.mustCloseCurrentWindowAndSwitchTo(handle)
		}
	}
}

func (r *runner) mustSwitchToWindow(handle string) {
	r.logf("Switching to window (%s)", handle)

	var currentWindowHandle string

	success := r.driver.Wait(func(w gs.WebDriver) bool {
		_, err := r.driver.SwitchToWindow(handle)
		must(err)

		res, err := w.WindowHandle()
		if err != nil {
			return false
		}

		currentWindowHandle = res.Handle
		isOnDesiredWindow := res.Handle == handle
		return isOnDesiredWindow
	}, TIMEOUT, SLEEP)

	if !success {
		must(errors.Errorf("Tried to switch to window (%s), but we're still on window (%s)", handle, currentWindowHandle))
	}
}

var badFileCharRe = regexp.MustCompile("[^A-Za-z0-9-.]")
var screenshotMaxNameLen = 100

func (r *runner) takeScreenshot(name string) error {
	r.logf("Taking screenshot with name: %s", name)
	if len(name) > screenshotMaxNameLen {
		name = name[:screenshotMaxNameLen]
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	go func() {
		select {
		case <-ctx.Done():
			// good!
		case <-time.After(5 * time.Second):
			r.logf("=================================================")
			r.logf("= It's been 5 seconds since we've started trying to take a screenshot.")
			r.logf("= That's usually a bad sign....")
			r.logf("=================================================")
		}
	}()

	if !r.readyForScreenshot {
		r.logf("Too early to take a screenshot, ignoring (%s)", name)
		return nil
	}

	s, err := r.driver.Screenshot()
	if err != nil {
		return errors.WithMessage(err, fmt.Sprintf("taking screenshot %s:", name))
	}

	imageBytes, err := s.ImageBytes()
	if err != nil {
		return errors.WithStack(err)
	}

	err = os.MkdirAll("screenshots", 0755)
	if err != nil {
		return errors.WithStack(err)
	}

	screenshotName := fmt.Sprintf("%s - %s", time.Now().UTC().Format(time.RFC3339Nano), name)
	screenshotName = badFileCharRe.ReplaceAllLiteralString(screenshotName, "_")
	screenshotPath := filepath.Join("screenshots", screenshotName+".png")

	err = ioutil.WriteFile(screenshotPath, imageBytes, 0644)
	if err != nil {
		return errors.WithStack(err)
	}
	r.logf("Wrote %s", screenshotPath)

	return nil
}
