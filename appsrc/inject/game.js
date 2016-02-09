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
  let gm4 = document.querySelectorAll('div.gm4html5_div_class')
  let emscripten = document.querySelectorAll('canvas.emscripten')
  if (gm4.length + emscripten.length === 0) {
    console.log(`Didn't detect emscripten or gm4, not trying to fit to window`)
    return
  }

  let canvases = document.getElementsByTagName('canvas')
  if (canvases.length !== 1) {
    console.log(`Didn't find exactly 1 canvas, not trying to fit to window`)
  }
  let canvas = canvases[0]

  let refit_canvas = function () {
    if (window.innerHeight > 0) {
      document.body.style.overflow = 'hidden'
      canvas.style.position = 'fixed'
      canvas.style.top = '50%'
      canvas.style.left = '50%'
      canvas.style.transform = 'translate(-50%, -50%)'
      canvas.style.margin = '0'
      canvas.style.height = window.innerHeight + 'px'
    }
  }
  window.onresize = refit_canvas
  refit_canvas()
})
