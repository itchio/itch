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

      let $ = window.$
      let btns = $('.checkout_btn, .confirm_vat_btn')
      btns.prop('disabled', true)
      btns.css('opacity', 0.7)
      btns.css('-webkit-filter', 'grayscale(70%)')
      btns.html($('<span><span class="icon icon-stopwatch itch_injected-spinner"></span> Loading...</span>'))

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

  // TODO: use `file:///` protocol instead, if that's no issue.
  let css = $(`<style>
    .itch_injected-spinner {
      animation: sk-rotateplane 2.4s .5s infinite ease-out;
    }

    @keyframes sk-rotateplane {
      0% { transform: perspective(120px) rotateY(0deg); }
      25% { transform: perspective(120px) rotateY(-180deg); }
      50% { transform: perspective(120px) rotateY(-180deg); }
      75% { transform: perspective(120px) rotateY(-360deg); }
      100% { transform: perspective(120px) rotateY(-360deg); }
    }
  </style>`)[0]

  css.onload = function () {
    console.log('CSS IN IFRAME LOADED')
  }

  document.body.appendChild(css)
} )
