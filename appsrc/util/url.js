
/* node's standard url module */
import url from 'url'

const self = {
  /** user.example.org => example.org */
  subdomain_to_domain: function (subdomain) {
    let parts = subdomain.split('.')
    while (parts.length > 2) {
      parts.shift()
    }
    return parts.join('.')
  },

  parse: url.parse.bind(url),
  format: url.format.bind(url)
}

export default self
