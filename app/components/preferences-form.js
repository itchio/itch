
let r = require('r-dom')
let mori = require('mori')
let humanize = require('humanize-plus')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let AppActions = require('../actions/app-actions')
let urls = require('../constants/urls')
let I18nStore = require('../stores/i18n-store')

let Tooltip = require('rc-tooltip')
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
            r.a({href: urls.itch_translation_platform}, [
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
      r.th({}, t('preferences.install_location.used_space')),
      r.th({}, t('preferences.install_location.free_space')),
      r.th({}, t('preferences.install_location.item_count')),
      r.th({}, ''),
      r.th({}, ''),
      r.th({}, '')
    ])

    let state = this.props.state
    let aliases = mori.toJs(mori.getIn(state, ['install-locations', 'aliases']))
    let default_loc = mori.getIn(state, ['install-locations', 'default'])

    let loc_map = mori.getIn(state, ['install-locations', 'locations'])
    let locations = mori.filter((x) => !mori.get(mori.last(x), 'deleted'), loc_map)

    // can't delete your last remaining location.
    let may_delete = mori.count(locations) > 0

    let rows = []
    rows.push(header)

    let index = -1

    mori.each(locations, (pair) => {
      index++
      let name = mori.first(pair)
      let location = mori.last(pair)
      let is_default = (name === default_loc)

      let path = mori.get(location, 'path')
      for (let alias of aliases) {
        path = path.replace(alias[0], alias[1])
      }
      let size = mori.get(location, 'size')
      let free_space = mori.get(location, 'free_space')
      let item_count = mori.get(location, 'item_count')
      let computing_size = mori.get(location, 'computing_size')

      let browse_i18n_key = 'preferences.install_location.browse'
      if (process.platform === 'darwin') {
        browse_i18n_key += '_osx'
      }

      rows.push(r.tr({}, [
        r.td({
          className: 'action',
          onClick: (e) => {
            e.preventDefault()
            AppActions.focus_panel(`locations/${name}`)
          }
        }, [
          r(Icon, {icon: 'folder'}),
          path
        ]),

        r.td({}, [
          (computing_size

            ? this.tooltip('preferences.install_location.stop_size_computation', r.span({
              className: 'action',
              onClick: (e) => {
                e.preventDefault()
                AppActions.install_location_cancel_size_computation(name)
              }
            }, r(Icon, {icon: 'stopwatch', spin: true})))

            : this.tooltip('preferences.install_location.compute_size', r.span({
              className: 'action',
              onClick: (e) => {
                e.preventDefault()
                AppActions.install_location_compute_size(name)
              }
            }, r(Icon, {icon: 'refresh'})))),

          (size === -1 ? '?' : humanize.fileSize(size))
        ]),

        r.td({}, [
          (free_space === -1 ? '?' : humanize.fileSize(free_space))
        ]),

        r.td({
          className: 'action',
          onClick: (e) => {
            e.preventDefault()
            AppActions.focus_panel(`locations/${name}`)
          }
        },
          item_count > 0
          ? item_count
          : r.span({className: 'empty'}, '0')
        ),

        (is_default

          ? this.tooltip('preferences.install_location.is_default', r.td({
            className: 'action default'
          }, r(Icon, {icon: 'star'})))

          : this.tooltip('preferences.install_location.make_default', r.td({
            className: 'action not_default',
            onClick: (e) => AppActions.install_location_make_default(name)
          }, r(Icon, {icon: 'star'})))),

        this.tooltip(browse_i18n_key, r.td({
          className: 'action',
          onClick: (e) => AppActions.install_location_browse(name)
        }, r(Icon, {icon: 'folder-open'}))),

        (may_delete

        ? this.tooltip('preferences.install_location.delete', r.td({
          className: 'action',
          onClick: (e) => AppActions.install_location_remove_request(name)
        }, r(Icon, {icon: 'cross'})))

        : r.td({}, ''))
      ]))
    })

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
      r.td({ colSpan: 6 })
    ]))

    return r.table({className: 'install_locations'}, [
      r.tbody({}, rows)
    ])
  }

  on_language_change (language) {
    AppActions.preferences_set_language(language)
  }

  tooltip (key, component) {
    let t = this.t

    return r(Tooltip, {
      mouseEnterDelay: 0.5,
      overlay: r.span({}, t(key))
    }, component)
  }
}

PreferencesForm.propTypes = {
  state: PropTypes.any
}

module.exports = PreferencesForm
