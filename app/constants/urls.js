
let self = {
  itch_repo: 'https://github.com/itchio/itch',
  itchio: 'https://itch.io',
  itch_translation_platform: 'https://weblate.itch.ovh',
  github_api: 'https://api.github.com',
  ibrew_repo: 'https://dl.itch.ovh'
}

let itchio_api = process.env.WHEN_IN_ROME ? 'http://localhost.com:8080' : self.itchio

Object.assign(self, {
  itchio_api,
  terms_of_service: `${self.itchio}/docs/legal/terms`,
  account_register: `${self.itchio}/register`,
  account_forgot_password: `${self.itchio}/user/forgot-password`,
  developers_learn_more: `${self.itchio}/developers`,
  my_collections: `${self.itchio}/my-collections`,
  rar_policy: `${self.itchio}/t/11918/rar-support-is-not-happening-repack-your-games`
})

module.exports = self
