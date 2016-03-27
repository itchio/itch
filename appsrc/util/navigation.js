
const ID_RE = /^[^\/]+\/(.+)$/
export function pathToId (path) {
  const matches = ID_RE.exec(path)
  if (!matches) {
    throw new Error('Could not extract id from path: ', path)
  }
  return matches[1]
}

export default {pathToId}
