
import * as actions from '../actions'

async function triggerOk (store, action) {
  const searchResults = document.querySelector('.hub-search-results.active')
  if (searchResults) {
    // results are open
    const chosen = searchResults.querySelector('.search-result.chosen')
    if (chosen) {
      console.log('Chosen search result: ', chosen)
      const path = chosen.getAttribute('data-path')
      if (path) {
        console.log('Path: ', path)
        store.dispatch(actions.navigate(path))
        store.dispatch(actions.closeSearch())
      }
    }
  }
}

async function triggerLocation (store, action) {
  const locationBar = document.querySelector('.hub-meat-tab.visible .browser-address')
  if (locationBar) {
    if (locationBar.tagName === 'INPUT') {
      locationBar.focus()
      locationBar.select()
    } else {
      locationBar.click()
    }
  }
}

async function triggerBack (store, action) {
  const searchBar = document.querySelector('#search')
  if (searchBar) {
    searchBar.blur()
  }

  const locationBar = document.querySelector('.hub-meat-tab.visible .browser-address')
  if (locationBar) {
    locationBar.blur()
  }
}

export default {triggerOk, triggerLocation, triggerBack}
