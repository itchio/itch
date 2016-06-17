
async function focusSearch (store, action) {
  const searchBar = document.querySelector('#search')
  if (searchBar) {
    searchBar.focus()
    searchBar.select()
  }
}

export default {focusSearch}
