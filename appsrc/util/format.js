
import {object, map} from 'underline'

export function slugify (str) {
  return str.toLowerCase()
    .replace(/[^a-zA-Z_ ]/g, '')
    .replace(/ +/g, '_')
}

export function camelify (str) {
  return str.replace(/_[a-z]/g, (x) => x[1].toUpperCase())
}

export function camelifyObject (obj) {
  if (typeof obj === 'object') {
    return obj::map((val, key) => [
      camelify(key),
      camelifyObject(val)
    ])::object()
  } else {
    return obj
  }
}

export default {slugify, camelify, camelifyObject}
