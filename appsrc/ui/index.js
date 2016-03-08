
import menu from './menu'
import window from './main-window'

export default function mount (store) {
  menu.mount(store)
  window.mount(store)
}
