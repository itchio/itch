
// This templates generates a sandbox policy file suitable for
// running relatively-untrusted apps via itch.

// Reference:
// https://reverse.put.as/wp-content/uploads/2011/09/Apple-Sandbox-Guide-v1.0.pdf

export default `
(version 1)
(deny default)

(allow file*
  (subpath "/Users/%username%/Library/Application Support")
  (subpath "/Users/%username%/Library/Preferences")
  (subpath "/Users/%username%/Library/Logs")
  (subpath "/Users/%username%/Library/Saved Application State") ;; Unity UI persistent stuff

  ;; FIXME probably a bit much ?
  (subpath "/dev")
)

(deny file*
  (subpath "/Users/%username%/Library/Application Support/itch")
)

(allow file*
  ;; where the app is actually installed
  ;; note: the app won't be able to scan/access apps from other locations
  (subpath "{{INSTALL_LOCATION}}")
)

(allow file-read*
  ;; binaries & executables
  (subpath "/usr/share")
  (subpath "/usr/lib")
  (subpath "/usr/bin")
  (subpath "/bin")
  (subpath "/System/Library")

  ;; preferences
  (subpath "/etc")
  (subpath "/private/etc")
  (subpath "/Library/Preferences")

  ;; resources
  (subpath "/Library/Audio")
  (subpath "/Library/Fonts")

  (subpath "/Users/%username%/Library/Keyboard Layouts")
  (subpath "/Users/%username%/Library/Input Methods")
  (subpath "/Users/%username%/Library/Fonts")

  ;; FIXME that's a bit excessive, why are some apps
  ;; trying to read 'PkgInfo' files or 'rsrc' ?
  (subpath "/Applications")
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

;; (required by SDL2 app, was asking for 'com.apple.cfprefsd.daemon')
(allow mach-lookup)
(allow mach-register) ;; 'axserver, portname, CFPasteboardClient'

;; Shared memory read-writes
(allow ipc-posix*)

;; ?? (required by SDL2 app)
(allow iokit-open)
`
