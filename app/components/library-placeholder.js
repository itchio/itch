
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let translate = require('react-i18next').translate
let ShallowComponent = require('./shallow-component')

let Icon = require('./icon')

class LibraryPlaceholder extends ShallowComponent {
  render () {
    let panel = this.props.panel

    if (panel === `owned`) {
      return (
        r.div({className: `placeholder`}, [
          r.div({className: 'placeholder_content'}, [
            r.h2({}, 'You made it!'),
            r.p({}, `Things are looking a bit empty right now, but no worries!`),
            r.p({}, `We've put together a few collections so you can start playing right away.`),
            r.p({className: 'hint'}, `Click the labels on your left to navigate around the app`)
          ]),
          r.span({className: 'icon icon-heart-filled placeholder_background'})
        ])
      )
    } else if (panel === `caved`) {
      return (
        r.div({className: `placeholder`}, [
          r.div({className: 'placeholder_content'}, [
            r.h2({}, 'Your library'),
            r.p({}, `Watch games quietly download, install, and run.`),
            r.p({}, [
              `If something breaks, click `,
              r.a({className: 'fake_button hollow', href: 'https://github.com/itchio/itch/issues'}, [
                r(Icon, {icon: 'heart-broken'})
              ]),
              ` to report it, or `,
              r.a({className: 'fake_button hollow', href: 'https://github.com/itchio/itch/blob/master/docs/diego.md'}, [
                r(Icon, {icon: 'bug'})
              ]),
              ` to investigate.`
            ]),
            r.p({className: 'hint'}, `Keep in mind this is a pre-alpha!`)
          ]),
          r.span({className: 'icon icon-checkmark placeholder_background'})
        ])
      )
    } else if (panel === `dashboard`) {
      return (
        r.div({className: `placeholder`}, [
          r.div({className: 'placeholder_content'}, [
            r.h2({}, 'Welcome home'),
            r.p({}, `We're trying to make it the comfiest.`),
            r.p({}, `Instant set-up, and as few barriers as we can manage.`)
          ]),
          r.span({className: 'icon icon-rocket placeholder_background'}),
          r.a({className: 'fat button', href: 'https://itch.io/developers'}, `Get started`)
        ])
      )
    } else if (/^collections/.test(panel)) {
      return (
        r.div({className: `placeholder`}, [
          r.div({className: 'placeholder_content'}, [
            r.h2({}, 'Mix & match'),
            r.p({}, [
              `Browse the site a little, then use`, r.a({href: 'https://itch.io/my-collections', className: 'fake_button'},
                [r(Icon, {icon: 'plus'}), ` Add to collection`]
              ), ` to start organizing.`]
            ),
            r.p({}, `Your games will be here when you come back.`)
          ]),
          r.span({className: 'icon icon-tag placeholder_background'}),
          r.a({className: 'fat button', href: 'https://itch.io'}, `Let's go shopping`)
        ])
      )
    } else {
      return r.div({}, '')
    }
  }
}

LibraryPlaceholder.propTypes = {
  panel: PropTypes.string
}

module.exports = translate('library-placeholder')(LibraryPlaceholder)
