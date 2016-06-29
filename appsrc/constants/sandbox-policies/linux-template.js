
// This templates generates a sandbox policy file suitable for
// running relatively-untrusted apps via itch.

export default `
blacklist ~/.config/itch/users
blacklist ~/.config/itch/butler_credentials
blacklist ~/.config/kitch/users
blacklist ~/.config/kitch/butler_credentials
blacklist ~/.config/chromium
blacklist ~/.config/chrome
blacklist ~/.mozilla
`
