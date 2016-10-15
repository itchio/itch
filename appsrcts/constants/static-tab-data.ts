
import { indexBy, map } from 'underscore'

const baseData = {
  featured: { label: 'itch.io', subtitle: ['sidebar.itchio'] },
  dashboard: { label: ['sidebar.dashboard'], subtitle: ['sidebar.dashboard_subtitle'] },
  collections: { label: ['sidebar.collections'] },
  library: { label: ['sidebar.owned'], subtitle: ['sidebar.owned_subtitle'] },
  preferences: { label: ['sidebar.preferences'] },
  history: { label: ['sidebar.history'] },
  downloads: { label: ['sidebar.downloads'] }
}

export default indexBy(map(baseData, (data, id) => Object.assign({}, data, { id, path: id })), 'id')
