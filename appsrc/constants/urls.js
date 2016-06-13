
const self = {
  itchRepo: 'https://github.com/itchio/itch',
  originalItchio: 'https://itch.io',
  appHomepage: 'https://itch.io/app',
  itchTranslationPlatform: 'https://weblate.itch.ovh/',
  githubApi: 'https://api.github.com',
  ibrewRepo: 'https://dl.itch.ovh',
  remoteLocalePath: 'http://locales.itch.ovh/itch',
  manual: 'https://docs.itch.ovh/itch/',
  updateServers: {
    stable: 'https://nuts.itch.zone',
    canary: 'http://nuts-canary.itch.ovh'
  }
}

self.itchio = process.env.WHEN_IN_ROME || self.originalItchio

Object.assign(self, {
  itchioApi: self.itchio,
  termsOfService: `${self.itchio}/docs/legal/terms`,
  accountRegister: `${self.itchio}/register`,
  accountForgotPassword: `${self.itchio}/user/forgot-password`,
  developersLearnMore: `${self.itchio}/developers`,
  myCollections: `${self.itchio}/my-collections`,
  rarPolicy: `${self.itchio}/t/11918/rar-support-is-not-happening-repack-your-games`,
  debPolicy: `${self.itchio}/t/13882/deb-and-rpm-arent-supported-by-itch-please-ship-portable-linux-builds`,
  rpmPolicy: `${self.itchio}/t/13882/deb-and-rpm-arent-supported-by-itch-please-ship-portable-linux-builds`,
  releasesPage: `${self.itchRepo}/releases`
})

export default self
