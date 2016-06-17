
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

export default {triggerLocation, triggerBack}
