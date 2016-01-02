
let r = require('r-dom')
let mori = require('mori')
let humanize = require('humanize-plus')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let AppActions = require('../actions/app-actions')
let I18nStore = require('../stores/i18n-store')

let SelectRow = require('./select-row')
let Icon = require('./icon')

class PreferencesForm extends ShallowComponent {
  constructor () {
    super()
    this.on_language_change = this.on_language_change.bind(this)
  }

  render () {
    let t = this.t
    let state = this.props.state
    let language = mori.getIn(state, ['preferences', 'language'])
    let locales = I18nStore.get_locales_list()

    return (
      r.div({className: 'preferences_panel'}, [
        r.span({className: 'icon icon-cog preferences_background'}),
        r.h2({}, t('menu.file.preferences')),

        r.form({className: `form preferences_form`}, [
          r(SelectRow, {
            on_change: this.on_language_change,
            options: locales,
            value: language,
            label: t('preferences.language')
          }),
          r.div({className: 'get_involved'}, [
            r.a({href: 'http://weblate.itch.ovh'}, [
              r(Icon, {icon: 'earth'}),
              t('preferences.language.get_involved', {name: 'itch'})
            ])
          ]),
          r.p({}, t('preferences.install_locations')),
          this.install_location_table()
        ])
      ])
    )
  }

  install_location_table () {
    let t = this.t

    let header = r.tr({}, [
      r.th({}, t('preferences.install_location.path')),
      r.th({}, t('preferences.install_location.size')),
      r.th({}, t('preferences.install_location.item_count')),
      r.th({}, ''),
      r.th({}, ''),
      r.th({}, '')
    ])

    let state = this.props.state
    let locations = mori.toJs(mori.getIn(state, ['install-locations', 'locations']))
    let aliases = mori.toJs(mori.getIn(state, ['install-locations', 'aliases']))

    let rows = []
    rows.push(header)

    let loc_keys = Object.keys(locations)
    let default_loc = mori.getIn(state, ['install-locations', 'default'])

    let index = -1

    for (let name of loc_keys) {
      index++
      let location = locations[name]
      let is_default = (name === default_loc)

      let path = location.path
      for (let alias of aliases) {
        path = path.replace(alias[0], alias[1])
      }
      let size = location.size
      let item_count = location.item_count
      let computing_size = location.computing_size

      rows.push(r.tr({}, [
        r.td({}, path),
        r.td({}, [
          (computing_size
            ? r.span({
              className: 'action',
              onClick: (e) => {
                e.preventDefault()
                AppActions.install_location_cancel_size_computation(name)
              }
            }, r(Icon, {icon: 'stopwatch', spin: true}))
            : r.span({
              'data-tip': t('preferences.install_location.compute_size'),
              'data-place': 'left',
              className: 'action',
              onClick: (e) => {
                e.preventDefault()
                AppActions.install_location_compute_size(name)
              }
            }, r(Icon, {icon: 'refresh'}))),
          (size === -1 ? '?' : humanize.fileSize(size))
        ]),
        r.td({},
          item_count > 0
          ? item_count
          : r.span({className: 'empty'}, '0')
        ),
        (is_default
        ? r.td({
          className: 'action default',
          'data-tip': t('preferences.install_location.is_default'),
          'data-place': 'left'
        }, r(Icon, {icon: 'star'}))
        : r.td({
          className: 'action not_default',
          'data-tip': t('preferences.install_location.make_default'),
          'data-place': 'left',
          onClick: (e) => AppActions.install_location_make_default(name)
        }, r(Icon, {icon: 'star'}))),
        r.td({
          className: 'action',
          'data-tip': t('preferences.install_location.browse'),
          'data-place': 'left',
          onClick: (e) => AppActions.install_location_browse(name)
        }, r(Icon, {icon: 'folder-open'})),
        r.td({
          className: 'action',
          'data-tip': t('preferences.install_location.delete'),
          'data-place': 'left',
          onClick: (e) => AppActions.install_location_remove_request(name)
        }, r(Icon, {icon: 'cross'}))
      ]))
    }

    rows.push(r.tr({}, [
      r.td({
        className: 'action add_new',
        onClick: (e) => {
          e.preventDefault()
          AppActions.install_location_add_request()
        }
      }, [
        r(Icon, {icon: 'plus'}),
        t('preferences.install_location.add')
      ]),
      r.td({ colSpan: 5 })
    ]))

    return r.table({className: 'install_locations'}, [
      r.tbody({}, rows)
    ])
  }

  on_language_change (language) {
    AppActions.preferences_set_language(language)
  }
}

PreferencesForm.propTypes = {
  state: PropTypes.any
}

module.exports = PreferencesForm
