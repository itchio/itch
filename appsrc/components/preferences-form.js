
let r = require('r-dom')
import {get, getIn, first, last, toJs, filter, each, count} from 'mori-ext'

let humanize = require('humanize-plus')
let PropTypes = require('react').PropTypes
let ShallowComponent = require('./shallow-component')

let AppActions = require('../actions/app-actions')
let urls = require('../constants/urls')
let I18nStore = require('../stores/i18n-store')
let os = require('../util/os')

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
    let language = state::getIn(['preferences', 'language'])
    let locales = I18nStore.get_locales_list()
    let sniff_code = I18nStore.get_sniffed_language()
    let sniffed = sniff_code
    for (let loc of locales) {
      if (loc.value === sniffed) {
        sniffed = loc.label
        break
      }
    }

    let updating_locales = state::getIn(['locales', 'updating'])

    let options = [{
      value: '__',
      label: t('preferences.language.auto', {language: sniffed, lngs: [sniff_code, 'en']})
    }].concat(locales)

    return (
      r.div({className: 'preferences_panel'}, [
        r.span({className: 'icon icon-cog preferences_background'}),
        r.h2({}, t('menu.file.preferences')),

        r.form({className: `form preferences_form`}, [
          r(SelectRow, {
            on_change: this.on_language_change,
            options,
            value: language || '__',
            label: t('preferences.language')
          }),

          r.div({
            className: 'locale_fetcher',
            onClick: (e) => {
              e.preventDefault()
              AppActions.locale_update_queue_download(language)
            }
          }, (updating_locales

            ? r(Icon, {
              icon: 'stopwatch',
              spin: true
            })

            : r(Icon, {
              icon: 'refresh'
            }))),

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
    let aliases = state::getIn(['install-locations', 'aliases'])::toJs()
    let default_loc = state::getIn(['install-locations', 'default'])

    let loc_map = state::getIn(['install-locations', 'locations'])
    let locations = loc_map::filter((x) => !x::last()::get('deleted'))

    // can't delete your last remaining location.
    let several_locations = locations::count() > 0

    let rows = []
    rows.push(header)

    let index = -1

    locations::each((pair) => {
      index++
      let name = pair::first()
      let location = pair::last()
      let is_default = (name === default_loc)
      let may_delete = several_locations && name !== 'appdata'

      let path = location::get('path')
      for (let alias of aliases) {
        path = path.replace(alias[0], alias[1])
      }
      let size = location::get('size')
      let free_space = location::get('free_space')
      let item_count = location::get('item_count')
      let computing_size = location::get('computing_size')

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
                AppActions.cancel_install_location_size_computation(name)
              }
            }, r(Icon, {icon: 'stopwatch', spin: true})))

            : this.tooltip('preferences.install_location.compute_size', r.span({
              className: 'action',
              onClick: (e) => {
                e.preventDefault()
                AppActions.compute_install_location_size(name)
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
            onClick: (e) => AppActions.make_install_location_default(name)
          }, r(Icon, {icon: 'star'})))),

        this.tooltip(this.browse_i18n_key(), r.td({
          className: 'action',
          onClick: (e) => AppActions.browse_install_location(name)
        }, r(Icon, {icon: 'folder-open'}))),

        (may_delete

        ? this.tooltip('preferences.install_location.delete', r.td({
          className: 'action',
          onClick: (e) => AppActions.remove_install_location_request(name)
        }, r(Icon, {icon: 'cross'})))

        : r.td({}, ''))
      ]))
    })

    rows.push(r.tr({}, [
      r.td({
        className: 'action add_new',
        onClick: (e) => {
          e.preventDefault()
          AppActions.add_install_location_request()
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

  browse_i18n_key () {
    let fallback = 'preferences.install_location.browse'
    switch (os.platform()) {
      case 'darwin': return ['preferences.install_location.browse_osx', fallback]
      case 'linux': return ['preferences.install_location.browse_linux', fallback]
      default: return fallback
    }
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
