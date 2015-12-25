
let r = require('r-dom')
let mori = require('mori')
let humanize = require('humanize-plus')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let AppActions = require('../actions/app-actions')

let SelectRow = require('./select-row')
let Icon = require('./icon')

let language_codes = require('../constants/language-codes')

class PreferencesForm extends ShallowComponent {
  constructor () {
    super()
    this.on_language_change = this.on_language_change.bind(this)
  }

  render () {
    let t = this.t
    let state = this.props.state
    let language = mori.getIn(state, ['preferences', 'language'])

    return (
      r.div({className: 'preferences_panel'}, [
        r.span({className: 'icon icon-cog preferences_background'}),
        r.h2({}, t('menu.file.preferences')),

        r.form({className: `form preferences_form`}, [
          r(SelectRow, {
            on_change: this.on_language_change,
            options: language_codes,
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
      r.th({}, '')
    ])

    let state = this.props.state
    let locations = mori.toJs(mori.getIn(state, ['install-locations', 'locations']))
    let aliases = mori.toJs(mori.getIn(state, ['install-locations', 'aliases']))

    let rows = []
    rows.push(header)

    for (let name of Object.keys(locations)) {
      let location = locations[name]

      console.log(`name / location = `, name, mori.toJs(location))
      let path = location.path
      for (let alias of aliases) {
        path = path.replace(alias[0], alias[1])
      }
      let size = location.size

      rows.push(r.tr({}, [
        r.td({}, path),
        r.td({}, (
          size === -1
          ? r.button({
            onClick: (e) => {
              e.preventDefault()
              AppActions.install_location_compute_size(name)
            }
          }, t('preferences.install_location.compute_size'))
          : humanize.fileSize(size)
        )),
        r.td({}, location.item_count),
        r.td({
          className: 'action',
          onClick: (e) => AppActions.install_location_browse(name)
        }, r(Icon, {icon: 'folder-open'})),
        r.td({
          className: 'action',
          onClick: (e) => AppActions.install_location_remove(name)
        }, r(Icon, {icon: 'delete'}))
      ]))
    }
    
    rows.push(r.tr({}, [
      r.td({
        colSpan: 5,
        className: 'action add_new',
        onClick: (e) => {
          e.preventDefault()
          AppActions.install_location_add_request()
        }
      }, [
        r(Icon, {icon: 'plus'}),
        'Add location'
      ])
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
