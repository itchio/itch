'use strict'

const I = {}

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

      const $ = window.$
      const $buttons = $('.checkout_btn, .confirm_vat_btn')
      disable($buttons)
      $buttons.html($('<span><span class="icon icon-stopwatch itch_injected-spinner"></span> Loading...</span>'))
      $buttons.not(':eq(0)').hide()

      // don't close the window here
    }
  }
})

function disable ($el) {
  $el.prop('disabled', true)
  $el.css('opacity', 0.7)
  $el.css('-webkit-filter', 'grayscale(70%)')
}

function purchase_inject () {
  const {$} = window
  const form = $('form.buy_form_widget')
  form.attr('target', '_self')

  // TODO: use `file:///` protocol instead, if that's no issue.
  const css = $(`<style>
    .itch_injected-spinner {
      animation: sk-rotateplane 2.4s .5s infinite ease-out;
    }

    @keyframes sk-rotateplane {
      0% {transform: perspective(120px) rotateY(0deg);}
      25% {transform: perspective(120px) rotateY(-180deg);}
      50% {transform: perspective(120px) rotateY(-180deg);}
      75% {transform: perspective(120px) rotateY(-360deg);}
      100% {transform: perspective(120px) rotateY(-360deg);}
    }
  </style>`)[0]

  css.onload = function () {
    console.log('CSS IN IFRAME LOADED')
  }

  document.body.appendChild(css)
}

function itch_inject () {
  const {$} = window
  $('.header_widget, .footer').css('pointer-events', 'none')
}

function login_inject () {
  itch_inject()

  const CredentialsStore = require('electron').remote.require('./stores/credentials-store').default
  const me = CredentialsStore.get_me()

  const {$} = window
  const $page = $('.user_login_page')
  const $title = $page.find('.stat_header_widget h2')
  $title.text(`Verify password for ${me.username}`)

  const $form = $page.find('.form')

  const $username = $form.find('input[name=username]')
  $username.val(me.username)
  $username.closest('.input_row').css('display', 'none')

  const $password = $form.find('input[name=password]')
  $password.focus()

  $form.find('.buttons .line').css('display', 'none')
}

function checkout_inject () {
  const {$} = window
  $('.close_button').on('click', (e) => {
    window.close()
    e.preventDefault()
    e.stopPropagation()
  })
}

document.addEventListener('DOMContentLoaded', () => {
  const url = require('electron').remote.require('./util/url').default
  const host = url.subdomain_to_domain(window.location.hostname)

  if (['itch.io', 'itch.ovh', 'localhost.com'].indexOf(host) === -1) {
    // don't inject anything on non-itch pages
    return
  }

  const tokens = window.location.pathname.split('/')
  const first_token = tokens[1]
  const last_token = tokens[tokens.length - 1]

  switch (last_token) {
    case 'purchase':
      purchase_inject()
      break
    case 'login':
      login_inject()
      break
    default:
      if (first_token === 'checkout') {
        checkout_inject()
      }
      break
  }
})
