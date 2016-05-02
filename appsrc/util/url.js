
/* node's standard url module */
import url from 'url'

/** user.example.org => example.org */
export function subdomainToDomain (subdomain) {
  const parts = subdomain.split('.')
  while (parts.length > 2) {
    parts.shift()
  }
  return parts.join('.')
}

export function isItchioURL (s) {
  return url.parse(s).protocol === 'itchio:'
}

export const parse = ::url.parse
export const format = ::url.format

export default {subdomainToDomain, isItchioURL, parse, format}
