
import * as moment from 'moment-timezone'

export function slugify(str: string): string {
  return str.toLowerCase()
    .replace(/[^a-zA-Z_ ]/g, '')
    .replace(/ +/g, '_')
}

const itchPlatforms = {
  'linux': 'GNU/Linux', // not SteamOS
  'windows': 'Windows',
  'osx': 'macOS' // since WWDC june 2016
}

export function itchPlatform(p: string): string {
  return itchPlatforms[p] || '???'
}

export function camelify(str: string): string {
  return str.replace(/_[a-z]/g, (x) => x[1].toUpperCase())
}

export function camelifyObject(obj: any): any {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      const res = Array(obj.length)
      for (let i = 0; i < obj.length; i++) {
        res[i] = camelifyObject(obj[i])
      }
      return res
    } else {
      const res = {}
      for (const key of Object.keys(obj)) {
        res[camelify(key)] = camelifyObject(obj[key])
      }
      return res
    }
  } else {
    return obj
  }
}

export function seconds(secs: number): Array<any> {
  if (secs < 60) {
    return ['duration.minute']
  } else if (secs < 3600) {
    return ['duration.minutes', { x: Math.floor(secs / 60).toFixed() }]
  } else if (secs < 3600 * 2) {
    return ['duration.hour']
  } else {
    return ['duration.hours', { x: Math.floor(secs / 3600).toFixed() }]
  }
}

export function date(v: any, f: string, lang = 'en'): string {
  try {
    return moment.tz(v, 'UTC').tz(moment.tz.guess()).locale(lang).format(f)
  } catch (err) {
    console.log(`Invalid date: ${v} — ${err.toString()}`)
    return '?'
  }
}

export const DATE_FORMAT = 'DD MMMM, YYYY @ HH:mm zz'
export const FS_DATE_FORMAT = 'YYYY.MM.DD-HH.mm.ss'

export function price(currency: string, value: number) {
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

export default { date, slugify, camelify, camelifyObject, seconds, DATE_FORMAT, price, itchPlatform }
