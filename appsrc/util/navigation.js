
const ID_RE = /^[^\/]+\/(.+)$/
export function pathToId (path) {
  const matches = ID_RE.exec(path)
  if (!matches) {
    throw new Error('Could not extract id from path: ', path)
  }
  return matches[1]
}

export function pathToIcon (path) {
  if (path === 'featured') {
    return 'star'
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
    return 'gamepad'
  }
  if (/^users/.test(path)) {
    return 'users'
  }
  if (/^search/.test(path)) {
    return 'search'
  }
  return 'earth'
}

export default {pathToId, pathToIcon}
