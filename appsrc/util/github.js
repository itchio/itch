
let urls = require('../constants/urls')
let needle = require('../promised/needle')

let self = {
  create_gist: async function (data) {
    let uri = `${urls.github_api}/gists`
    let resp = await needle.requestAsync('POST', uri, data, {json: true})
    if (resp.statusCode === 201) {
      return resp.body
    }
    throw new Error(`Could not create gist: HTTP ${resp.statusCode}, ${JSON.stringify(resp.body, null, 2)}`)
  }
}

module.exports = self
