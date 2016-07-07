
import {indexBy, map} from 'underline'

export default {
  featured: { label: 'itch.io', subtitle: ['sidebar.itchio'] },
  dashboard: { label: ['sidebar.dashboard'], subtitle: ['sidebar.dashboard_subtitle'] },
  collections: { label: ['sidebar.collections'] },
  press: { label: ['sidebar.press'], subtitle: ['sidebar.press_subtitle'] },
  library: { label: ['sidebar.owned'], subtitle: ['sidebar.owned_subtitle'] },
  preferences: { label: ['sidebar.preferences'] },
  history: { label: ['sidebar.history'] },
  downloads: { label: ['sidebar.downloads'] }
}::map((data, id) => {
  return {...data, id, path: id}
})::indexBy('id')
