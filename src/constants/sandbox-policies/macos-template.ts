// This templates generates a sandbox policy file suitable for
// running relatively-untrusted apps via itch.

// Reference:
// https://reverse.put.as/wp-content/uploads/2011/09/Apple-Sandbox-Guide-v1.0.pdf

export default `
(version 1)
(deny default)

(allow file*
  (subpath "{{USER_LIBRARY}}/Application Support")
  (subpath "{{USER_LIBRARY}}/Preferences")
  (subpath "{{USER_LIBRARY}}/Logs")
  (subpath "{{USER_LIBRARY}}/Caches")
  (subpath "{{USER_LIBRARY}}/KeyBindings")
  (subpath "{{USER_LIBRARY}}/Saved Application State")

  ;; FIXME probably a bit much ?
  (subpath "/dev")
  (subpath "/private/var/folders")
  (subpath "/var/folders" )
)

(deny file*
  (subpath "{{USER_LIBRARY}}/Application Support/itch")
  (subpath "{{USER_LIBRARY}}/Application Support/kitch")
  (subpath "{{USER_LIBRARY}}/Application Support/Google")
  (subpath "{{USER_LIBRARY}}/Application Support/Mozilla")
)

(allow file*
  ;; where the app is actually installed
  ;; note: the app won't be able to scan/access apps from other locations
  (subpath "{{INSTALL_LOCATION}}")
)

(allow file-read*
  ;; binaries & executables
  (subpath "/usr/local")
  (subpath "/usr/share")
  (subpath "/usr/lib")
  (subpath "/usr/bin")
  (subpath "/bin")
  (subpath "/System/Library")
  (subpath "/Library/Java/JavaVirtualMachines")

  ;; is this overkill and if so, what's the right fix?
  ;; without it, Chromium can't load images over HTTPS
  (subpath "/private")

  ;; preferences
  (subpath "/etc")
  (subpath "/private/etc")
  (subpath "/Library/Preferences")

  ;; resources
  (subpath "/Library/Audio")
  (subpath "/Library/Fonts")

  (subpath "{{USER_LIBRARY}}/Keyboard Layouts")
  (subpath "{{USER_LIBRARY}}/Input Methods")
  (subpath "{{USER_LIBRARY}}/Fonts")

  ;; FIXME that's a bit excessive, why are some apps
  ;; trying to read 'PkgInfo' files or 'rsrc' ?
  (subpath "/Applications")

  ;; Chrome Helper
  (literal "/Library/Application Support/CrashReporter/SubmitDiagInfo.domains")
  (literal "/")
)

;; You'd be surprised what some apps scan for some reason
(allow file-read-metadata)

;; threads + launching other binaries
(allow process-fork)
(allow process-exec)

;; probe hardware/OS limits? e.g. hw.pagesize_compat
(allow sysctl-read)

;; network
(allow network-bind)
(allow network-outbound)

;; (required by Electron/Chromium to load images, for example)
(allow system-socket)

;; (required by SDL2 app, was asking for 'com.apple.cfprefsd.daemon')
(allow mach-lookup)
(allow mach-register) ;; 'axserver, portname, CFPasteboardClient'

;; Shared memory read-writes
(allow ipc-posix*)

;; ?? (required by SDL2 app)
(allow iokit-open)
`;
