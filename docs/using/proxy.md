
# Using a proxy

As of v18.5.0, you can use the itch app behind an HTTP(S) proxy.

The app will attempt to detect your system settings (Windows, Linux, macOS, etc.),
but if it gets them wrong, you can set the environment variable `HTTP_PROXY` to
the correct setting. (The app will also read `http_proxy`).

For example, if your HTTP(S) proxy is running locally, on port 8081, you would
set the value of `HTTP_PROXY` to `localhost:8081`.

*Here's a guide to to [setting an environment variable on Windows](http://www.computerhope.com/issues/ch000549.htm)*

The preferences tab will show if any proxy settings are active, and where
it got them from (system or environment). When setting an environment variable,
you need to restart the app (`Ctrl+Q`, `Command+Q` on macOS, then relaunch) for
it to take effect.
