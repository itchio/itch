
const self = {
  itchRepo: 'https://github.com/itchio/itch',
  watchlistRepo: 'https://github.com/itchio/itch-compatibility-watchlist',
  originalItchio: 'https://itch.io',
  appHomepage: 'https://itch.io/app',
  itchTranslationPlatform: 'https://weblate.itch.ovh/',
  githubApi: 'https://api.github.com',
  ibrewRepo: 'https://dl.itch.ovh',
  remoteLocalePath: 'https://locales.itch.ovh/itch',
  manual: 'https://itch.io/docs/itch/',
  updateServers: {
    stable: 'https://nuts.itch.zone',
    canary: 'https://nuts-canary.itch.ovh'
  }
}

self.itchio = process.env.WHEN_IN_ROME || self.originalItchio

Object.assign(self, {
  itchioApi: self.itchio,
  termsOfService: `${self.itchio}/docs/legal/terms`,
  accountRegister: `${self.itchio}/register`,
  accountForgotPassword: `${self.itchio}/user/forgot-password`,
  developersLearnMore: `${self.itchio}/developers`,
  dashboard: `${self.itchio}/dashboard`,
  myCollections: `${self.itchio}/my-collections`,
  rarPolicy: `${self.itchio}/t/11918/rar-support-is-not-happening-repack-your-games`,
  debPolicy: `${self.itchio}/t/13882/deb-and-rpm-arent-supported-by-itch-please-ship-portable-linux-builds`,
  rpmPolicy: `${self.itchio}/t/13882/deb-and-rpm-arent-supported-by-itch-please-ship-portable-linux-builds`,
  linuxSandboxSetup: `${self.manual}/sandbox/linux#one-time-setup`,
  windowsSandboxSetup: `${self.manual}/sandbox/windows#one-time-setup`,
  releasesPage: `${self.itchRepo}/releases`
})

export default self
