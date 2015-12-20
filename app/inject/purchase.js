'use strict'

let I = {}

Object.defineProperty(window, 'I', {
  get: () => I,
  set: (val) => Object.assign(I, val)
})

let BBF

Object.defineProperty(I, 'BaseBuyForm', {
  get: () => BBF,
  set: (val) => {
    BBF = val
    BBF.prototype.submit_handler = function () {
      if (!this.is_valid()) return false
      // don't close the window here
    }
  }
})

document.addEventListener('DOMContentLoaded', () => {
  let tokens = window.location.pathname.split('/')
  let last_token = tokens[tokens.length - 1]
  if (last_token !== 'purchase') return

  let $ = window.$
  let form = $('form.buy_form_widget')
  form.attr('target', '_self')
})
