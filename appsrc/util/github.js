
import urls from '../constants/urls'
import needle from '../promised/needle'

async function createGist (data) {
  let uri = `${urls.githubApi}/gists`
  let resp = await needle.requestAsync('POST', uri, data, {json: true})
  if (resp.statusCode === 201) {
    return resp.body
  }
  throw new Error(`Could not create gist: HTTP ${resp.statusCode}, ${JSON.stringify(resp.body, null, 2)}`)
}

export default {createGist}
