'use strict'

const {remote} = require('electron')
const urlParser = remote.require('./util/url').default
const navigation = remote.require('./util/navigation').default
const store = remote.require('./store').default

const sendMessage = (action) => {
  const url = `https://itch-internal/${action}`
  const xhr = new window.XMLHttpRequest()
  xhr.open('POST', url)
  xhr.send()
}

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
      $buttons.html($('<span><span class="icon icon-stopwatch itchInjectedSpinner"></span> Loading...</span>'))
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

function purchaseInject () {
  const {$} = window
  const form = $('form.buy_form_widget')
  form.attr('target', '_self')

  // TODO: use `file:///` protocol instead, if that's no issue.
  const css = $(`<style>
    .itchInjectedSpinner {
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

  document.body.appendChild(css)
}

function itchInject () {
  const {$} = window

  $('#user_tools').hide()
  $('.admin_tag_editor_widget').hide()
  $('.above_game_banner').hide()
  $('.header_widget').hide()

  {
    const $page = $('.view_game_page')
    if ($page.length) {
      $page.find('.buy_row').prev('h2').hide()
      $page.find('.game_frame, .buy_row, .donate, .uploads').hide()
    }
  }

  {
    const $page = $('.index_page')
    if ($page.length) {
      $page.find('.index_sidebar').remove()
      $page.find('.anon_intro').remove()
      $page.find('.app_banner').remove()
      $page.find('.main_column').css('margin', 0)
    }
  }
}

function loginInject () {
  const {me} = store.getState().session.credentials
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

function checkoutInject () {
  const {$} = window
  $('.close_button').on('click', (e) => {
    window.close()
    e.preventDefault()
    e.stopPropagation()
  })
}

document.addEventListener('click', (e) => {
  let target = e.target

  while (target && target.tagName !== 'A') {
    target = target.parentNode
  }

  if (!target) {
    return
  }

  if (navigation.isAppSupported(target.href)) {
    console.log('supported url, telling app', target.href)
    sendMessage('supported-url?url=' + encodeURIComponent(target.href))
    e.preventDefault()
    return false
  } else {
    console.log('non-app-supported url, carrying as usual', target.href)
  }
})

document.addEventListener('DOMContentLoaded', () => {
  const host = urlParser.subdomainToDomain(window.location.hostname)

  setTimeout(function () {
    const itchPath = document.querySelector('meta[name="itch:path"]')
    if (itchPath) {
      sendMessage('parsed-itch-path?path=' + encodeURIComponent(itchPath.content) + '&url=' + encodeURIComponent(window.location.href))
    }
  }, 0)

  if (['itch.io', 'itch.ovh', 'localhost.com'].indexOf(host) === -1) {
    // don't inject anything on non-itch pages
    console.log('not an itch page, bailing out', host)
    return
  }

  console.log('injecting itch js')
  itchInject()

  const tokens = window.location.pathname.split('/')
  const firstToken = tokens[1]
  const lastToken = tokens[tokens.length - 1]

  switch (lastToken) {
    case 'purchase':
      purchaseInject()
      break
    case 'login':
      loginInject()
      break
    default:
      if (firstToken === 'checkout') {
        checkoutInject()
      }
      break
  }
})
