'use strict'

// TODO: prefill login form

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
      let $buttons = $('.checkout_btn, .confirm_vat_btn')
      disable($buttons)
      $buttons.html($('<span><span class="icon icon-stopwatch itch_injected-spinner"></span> Loading...</span>'))

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
}

function itch_inject () {
  let $ = window.$
  $('.header_widget, .footer').css('pointer-events', 'none')
}

function login_inject () {
  itch_inject()

  let CredentialsStore = require('electron').remote.require('./stores/credentials-store')
  let me = CredentialsStore.get_me()

  let $ = window.$
  let $page = $('.user_login_page')
  let $title = $page.find('.stat_header_widget h2')
  $title.text(`Verify password for ${me.username}`)

  let $form = $page.find('.form')

  let $username = $form.find('input[name=username]')
  $username.val(me.username)
  $username.closest('.input_row').css('display', 'none')

  let $password = $form.find('input[name=password]')
  $password.focus()

  $form.find('.buttons .line').css('display', 'none')
}

document.addEventListener('DOMContentLoaded', () => {
  let url = require('electron').remote.require('./util/url')
  let host = url.subdomain_to_domain(window.location.hostname)

  if (['itch.io', 'itch.ovh', 'localhost.com'].indexOf(host) === -1) {
    // don't inject anything on non-itch pages
    return
  }

  let tokens = window.location.pathname.split('/')
  let last_token = tokens[tokens.length - 1]

  switch (last_token) {
    case 'purchase':
      purchase_inject()
      break
    case 'login':
      login_inject()
      break
  }
})
