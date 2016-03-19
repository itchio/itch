
const self = {
  itchRepo: 'https://github.com/itchio/itch',
  itchio: 'https://itch.io',
  itchTranslationPlatform: 'https://weblate.itch.ovh/projects/itch',
  githubApi: 'https://api.github.com',
  ibrewRepo: 'https://dl.itch.ovh',
  remoteLocalePath: 'http://locales.itch.ovh/itch',
  updateServers: {
    stable: 'https://nuts.itch.zone',
    canary: 'https://nuts-canary.itch.ovh'
  }
}

const itchioApi = process.env.WHEN_IN_ROME || self.itchio

Object.assign(self, {
  itchioApi,
  termsOfService: `${self.itchio}/docs/legal/terms`,
  accountRegister: `${self.itchio}/register`,
  accountForgotPassword: `${self.itchio}/user/forgot-password`,
  developersLearnMore: `${self.itchio}/developers`,
  myCollections: `${self.itchio}/my-collections`,
  rarPolicy: `${self.itchio}/t/11918/rar-support-is-not-happening-repack-your-games`,
  debPolicy: `${self.itchio}/t/13882/deb-and-rpm-arent-supported-by-itch-please-ship-portable-linux-builds`,
  rpmPolicy: `${self.itchio}/t/13882/deb-and-rpm-arent-supported-by-itch-please-ship-portable-linux-builds`
})

export default self
