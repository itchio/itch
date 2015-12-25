
let r = require('r-dom')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')
let interleave = require('./interleave')

let Icon = require('./icon')

class LibraryPlaceholder extends ShallowComponent {
  render () {
    let panel = this.props.panel
    let t = this.t

    if (panel === `owned`) {
      return (
        r.div({className: `placeholder`}, [
          r.div({className: 'placeholder_content'}, [
            r.h2({}, t('onboarding.owned.title_warm_welcome')),
            r.p({}, t('onboarding.owned.reassuring_comment')),
            r.p({}, t('onboarding.owned.batteries_included')),
            r.p({className: 'hint'}, t('onboarding.owned.navigation_hint'))
          ]),
          r.span({className: 'icon icon-heart-filled placeholder_background'})
        ])
      )
    } else if (panel === `caved`) {
      return (
        r.div({className: `placeholder`}, [
          r.div({className: 'placeholder_content'}, [
            r.h2({}, t('onboarding.caved.title_pick')),
            r.p({}, t('onboarding.caved.usage')),
            r.p({}, interleave(t, 'onboarding.caved.troubleshoot_advice', {
              report: r.a({className: 'fake_button hollow', href: 'https://github.com/itchio/itch/issues'}, [
                r(Icon, {icon: 'heart-broken'})
              ]),
              probe: r.a({className: 'fake_button hollow', href: 'https://github.com/itchio/itch/blob/master/docs/diego.md'}, [
                r(Icon, {icon: 'bug'})
              ])
            })),
            r.p({className: 'hint'}, t('onboarding.caved.prealpha_reminder'))
          ]),
          r.span({className: 'icon icon-checkmark placeholder_background'})
        ])
      )
    } else if (panel === `dashboard`) {
      return (
        r.div({className: `placeholder`}, [
          r.div({className: 'placeholder_content'}, [
            r.h2({}, t('onboarding.dashboard.welcome_home')),
            r.p({}, t('onboarding.dashboard.mission_statement')),
            r.p({}, t('onboarding.dashboard.selling_points'))
          ]),
          r.span({className: 'icon icon-rocket placeholder_background'}),
          r.a({className: 'fat button', href: 'https://itch.io/developers'}, t('onboarding.dashboard.docs_link'))
        ])
      )
    } else if (/^collections/.test(panel)) {
      return (
        r.div({className: `placeholder`}, [
          r.div({className: 'placeholder_content'}, [
            r.h2({}, t('onboarding.collections.title_mix')),
            r.p({}, interleave(t, 'onboarding.collections.usage', {
              add_to_collection: r.a({href: 'https://itch.io/my-collections', className: 'fake_button'},
                // N.B: Not translating this until itch.io get i18n'd
                [r(Icon, {icon: 'plus'}), ` Add to collection`]
              )
            })),
            r.p({}, t('onboarding.collections.auto_sync'))
          ]),
          r.span({className: 'icon icon-tag placeholder_background'}),
          r.a({className: 'fat button', href: 'https://itch.io'}, t('onboarding.collections.lets_shop'))
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

module.exports = LibraryPlaceholder
