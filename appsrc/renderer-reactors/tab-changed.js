
async function tabChanged (store, action) {
  const {id} = action.payload
  const item = document.querySelector(`.hub-sidebar-item[data-id='${id}']`)
  if (item) {
    item.scrollIntoView()
  }
}

export default {tabChanged}
