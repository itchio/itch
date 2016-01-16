
let electron = require('electron')

let self = {
  open: (folder) => {
    if (process.platform === 'darwin') {
      // openItem will open the finder but it will appear *under* the app
      // which is a bit silly, so we just reveal it instead.
      electron.shell.showItemInFolder(folder)
    } else {
      electron.shell.openItem(folder)
    }
  }
}

module.exports = self
