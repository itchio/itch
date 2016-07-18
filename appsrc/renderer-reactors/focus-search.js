
import delay from '../reactors/delay'

async function focusSearch (store, action) {
  const searchBar = document.querySelector('#search')
  if (searchBar) {
    searchBar.focus()
    searchBar.select()
  }
}

async function closeSearch (store, action) {
  const searchBar = document.querySelector('#search')
  if (searchBar && document.hasFocus(searchBar)) {
    searchBar.blur()
  }
}

async function focusFilter (store, action) {
  const filterBar = document.querySelector('.hub-meat-tab.visible .filter-input-field')
  if (filterBar) {
    filterBar.focus()
    filterBar.select()
  }
}

async function clearFilters () {
  const filterBar = document.querySelector('.hub-meat-tab.visible .filter-input-field')
  if (filterBar) {
    filterBar.value = ''
  }
}

async function searchHighlightOffset () {
  await delay(20)
  const searchResults = document.querySelector('.hub-search-results.active')
  if (searchResults) {
    const chosen = searchResults.querySelector('.search-result.chosen')
    if (chosen) {
      chosen.scrollIntoViewIfNeeded()
    }
  }
}

export default {focusSearch, closeSearch, focusFilter, clearFilters, searchHighlightOffset}
