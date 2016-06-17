
import ospath from 'path'

async function notifyHtml5 (store, action) {
  const {title, opts, onClick} = action.payload
  if (opts.icon) {
    opts.icon = ospath.resolve(ospath.join(__dirname, '..', opts.icon))
  }
  const notification = new Notification(title, opts) // eslint-disable-line

  if (onClick) {
    notification.onClick = () => {
      store.dispatch(onClick)
    }
  }
}

export default {notifyHtml5}
