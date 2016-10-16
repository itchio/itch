
import urlParser from './url'
import * as dns from 'dns'
import * as querystring from 'querystring'

import staticTabData from '../constants/static-tab-data'
import * as invariant from 'invariant'

import { GameRecord, UserRecord, CollectionRecord, InstallLocationRecord, TabData, TabDataSet } from '../types/db'

const ITCH_HOST_RE = /^([^.]+)\.(itch\.io|localhost\.com:8080)$/
const ID_RE = /^[^\/]+\/(.*)$/

interface DNSError {
  code?: number
  message: string
}

export async function transformUrl(original: string): Promise<string> {
  if (/^about:/.test(original)) {
    return original
  }

  let req = original
  let parsed = urlParser.parse(req)
  const searchUrl = () => {
    const q = original
    return 'https://duckduckgo.com/?' + querystring.stringify({ q, kae: 'd' })
  }

  if (!parsed.hostname) {
    req = 'http://' + original
    parsed = urlParser.parse(req)
    if (!parsed.hostname) {
      return searchUrl()
    }
  }

  return await new Promise<string>((resolve, reject) => {
    dns.lookup(parsed.hostname, (err) => {
      if (err) {
        const dnsError = err as DNSError
        console.log(`dns error: ${dnsError.code} / ${dnsError.message}`)
        resolve(searchUrl())
      }
      resolve(req)
    })
  })
}

export function pathToId(path: string): string {
  const matches = ID_RE.exec(path)
  if (!matches) {
    throw new Error(`Could not extract id from path: ${JSON.stringify(path)}`)
  }
  return matches[1]
}

export function pathToIcon(path: string) {
  if (path === 'featured') {
    return 'itchio'
  }
  if (path === 'dashboard') {
    return 'rocket'
  }
  if (path === 'library') {
    return 'heart-filled'
  }
  if (path === 'preferences') {
    return 'cog'
  }
  if (path === 'history') {
    return 'history'
  }
  if (path === 'downloads') {
    return 'download'
  }
  if (/^collections/.test(path)) {
    return 'video_collection'
  }
  if (/^games/.test(path)) {
    return 'star'
  }
  if (/^users/.test(path)) {
    return 't-shirt'
  }
  if (/^search/.test(path)) {
    return 'search'
  }
  if (/^locations/.test(path)) {
    return 'folder'
  }
  if (/^new/.test(path)) {
    return 'star2'
  }
  return 'earth'
}

export function gameToTabData(game: GameRecord): TabData {
  return {
    games: {
      [game.id]: game
    },
    label: game.title,
    subtitle: game.shortText,
    image: game.stillCoverUrl || game.coverUrl,
    imageClass: 'game',
    iconImage: game.stillCoverUrl || game.coverUrl
  }
}

export function userToTabData(user: UserRecord) {
  return {
    users: {
      [user.id]: user
    },
    label: user.displayName || user.username,
    subtitle: '',
    image: user.stillCoverUrl || user.coverUrl,
    imageClass: 'user',
    iconImage: user.stillCoverUrl || user.coverUrl
  }
}

export function collectionToTabData(collection: CollectionRecord) {
  return {
    collections: {
      [collection.id]: collection
    },
    label: collection.title,
    subtitle: ['sidebar.collection.subtitle', { itemCount: collection.gamesCount }]
  }
}

export function locationToTabData(location: InstallLocationRecord) {
  return {
    label: location.path
  }
}

export function makeLabel(id: string, tabData: TabDataSet) {
  const staticData = staticTabData[id]
  if (staticData) {
    return staticData.label
  }

  if (!tabData) {
    tabData = {} as TabDataSet
  }

  const data = tabData[id]
  if (data) {
    const {path} = data
    if (path && /^url/.test(path)) {
      if (data.webTitle) {
        return data.webTitle
      }
    } else {
      if (data.label) {
        return data.label
      }
    }
  }

  return 'Loading...'
}

export function isAppSupported(url: string) {
  const {host, pathname} = urlParser.parse(url)

  if (ITCH_HOST_RE.test(host)) {
    const pathItems = pathname.split('/')
    if (pathItems.length === 2) {
      if (pathItems[1].length > 0) {
        // xxx.itch.io/yyy
        return 'game'
      } else {
        // xxx.itch.io
        return 'user'
      }
    }
  }

  return null
}

export default { transformUrl, pathToId, pathToIcon, gameToTabData, collectionToTabData, isAppSupported }
