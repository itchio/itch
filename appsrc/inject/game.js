'use strict'

let sendMessage = (action) => {
  let url = `https://itch-internal/${action}`
  let xhr = new window.XMLHttpRequest()
  xhr.open('POST', url)
  xhr.send()
}

window.addEventListener('keydown', (e) => {
  switch (e.keyIdentifier) {
    case 'F11':
      sendMessage('toggle-fullscreen')
      break
    case 'F12':
      if (!e.shiftKey) return
      sendMessage('open-devtools')
      break
  }
})

window.addEventListener('DOMContentLoaded', (e) => {
  let refit_canvas = function () {
    let canvas = document.getElementById('canvas')
    if (canvas) {
      document.body.style.overflow = 'hidden'
      canvas.style.margin = '0'
      canvas.style.height = document.body.clientHeight + 'px'
    }
  }
  window.onresize = refit_canvas
  refit_canvas()
})
