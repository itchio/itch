
import {indexBy, map} from 'underline'

export default {
  featured: { label: 'itch.io', subtitle: ['sidebar.itchio'] },
  dashboard: { label: ['sidebar.dashboard'], subtitle: ['sidebar.dashboard_subtitle'] },
  collections: { label: ['sidebar.collections'] },
  press: { label: ['sidebar.press'], subtitle: ['sidebar.press_subtitle'] },
  library: { label: ['sidebar.owned'], subtitle: ['sidebar.owned_subtitle'] },
  preferences: { label: ['sidebar.preferences'], subtitle: ['sidebar.preferences_subtitle'] },
  history: { label: ['sidebar.history'], subtitle: ['sidebar.history_subtitle'] },
  // downloads: { label: ['sidebar.downloads'], subtitle: ['sidebar.downloads_subtitle'] }
  downloads: { label: ['sidebar.downloads'] }
}::map((data, id) => {
  return {...data, id, path: id}
})::indexBy('id')
