
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
    if (Array.isArray(obj)) {
      return obj::map((val, key) => camelifyObject(val))
    } else {
      return obj::map((val, key) => [ camelify(key), camelifyObject(val) ])::object()
    }
  } else {
    return obj
  }
}

export function seconds (secs) {
  if (secs < 60) {
    return ['duration.minute']
  } else if (secs < 3600) {
    return ['duration.minutes', {x: Math.ceil(secs / 60).toFixed()}]
  } else if (secs < 3600 * 2) {
    return ['duration.hour']
  } else {
    return ['duration.hours', {x: Math.ceil(secs / 3600).toFixed()}]
  }
}

export const DATE_FORMAT = 'mmmm dS, yyyy @ HH:MM TT'
export const FS_DATE_FORMAT = 'yyyy.mm.dd-HH.MM.TT'

export function price (currency, value) {
  if (currency === 'USD') {
    return `$${(value / 100).toFixed(2)}`
  } else if (currency === 'CAD') {
    return `CAD $${(value / 100).toFixed(2)}`
  } else if (currency === 'AUD') {
    return `AUD $${(value / 100).toFixed(2)}`
  } else if (currency === 'GBP') {
    return `£${(value / 100).toFixed(2)}`
  } else if (currency === 'JPY') {
    return `¥${value.toFixed(2)}`
  } else if (currency === 'EUR') {
    return `${(value / 100).toFixed(2)} €`
  } else {
    return '???'
  }
}

export default {slugify, camelify, camelifyObject, seconds, DATE_FORMAT, price}
