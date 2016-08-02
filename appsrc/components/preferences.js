
import React, {Component, PropTypes} from 'react'
import {createSelector, createStructuredSelector} from 'reselect'
import {connect} from './connect'

import {shell} from '../electron'

import path from 'path'
import humanize from 'humanize-plus'
import classNames from 'classnames'

import urls from '../constants/urls'

import Icon from './icon'
import SelectRow from './select-row'
import {versionString} from './hub-sidebar'

import * as actions from '../actions'

import {map, each, filter} from 'underline'

import diskspace from '../util/diskspace'

// XXX bad, but we'll live
const needle = require('electron').remote.require('./promised/needle')

function getAppLogPath () {
  const logOpts = require('electron').remote.require('./logger')
  const logPath = logOpts.logger.opts.sinks.file
  console.log(`found out logPath = ${logPath}`)
  return logPath
}

export class Preferences extends Component {
  render () {
    const {t, lang, sniffedLang = '', downloading, locales, isolateApps, closeToTray, showAdvanced} = this.props
    const {queueLocaleDownload, updatePreferences} = this.props

    const options = [{
      value: '__',
      label: t('preferences.language.auto', {language: sniffedLang})
    }].concat(locales)

    let translateUrl = `${urls.itchTranslationPlatform}/projects/itch/itch`
    if (lang !== 'en' && lang !== '__') {
      translateUrl += `/${lang}`
    }

    const translationBadgeUrl = `${urls.itchTranslationPlatform}/widgets/itch/${lang || 'en'}/svg-badge.svg`

    return <div className='preferences-meat'>
      <h2>{t('preferences.language')}</h2>
      <div className='language-form'>
        <label className='active'>
          <SelectRow onChange={::this.onLanguageChange} options={options} value={lang || '__'}/>

          <div className='locale-fetcher' onClick={(e) => { e.preventDefault(); queueLocaleDownload(lang) }}>
            {downloading
              ? <Icon icon='download' classes='scan'/>
              : <Icon icon='repeat'/>
            }
          </div>
        </label>
      </div>

      <p className='explanation flex'>
        {t('preferences.language.get_involved', {name: 'itch'}) + ' '}
        <a href={translateUrl}>
          <img className='weblate-badge' src={translationBadgeUrl}/>
        </a>
      </p>

      <h2>{t('preferences.security')}</h2>
      <div className='security-form'>
        <label className={classNames({active: isolateApps})}>
          <input type='checkbox' checked={isolateApps} onChange={(e) => { updatePreferences({isolateApps: e.target.checked}) }}/>
          <span> {t('preferences.security.sandbox.title')} </span>
          <span className='hint--bottom' data-hint={t('label.experimental')}>
            <Icon icon='lab-flask' onClick={(e) => e.preventDefault()}/>
          </span>
        </label>
      </div>

      <p className='explanation'>
        {t('preferences.security.sandbox.description')}
        {' '}
        <a href={urls.sandboxDocs}>
          {t('docs.learn_more')}
        </a>
      </p>

      <h2>{t('preferences.behavior')}</h2>
      <div className='behavior-form'>
        <label className={classNames({active: closeToTray})}>
          <input type='checkbox' checked={closeToTray} onChange={(e) => { updatePreferences({closeToTray: e.target.checked}) }}/>
          <span> {t('preferences.behavior.close_to_tray')} </span>
        </label>
      </div>

      <h2>{t('preferences.install_locations')}</h2>
      {this.installLocationTable()}

      <h2 className='toggle' onClick={(e) => updatePreferences({showAdvanced: !showAdvanced})}>
        <span className={`icon icon-triangle-right turner ${showAdvanced ? 'turned' : ''}`}/>
        {' '}
        {t('preferences.advanced')}
      </h2>
      {showAdvanced
      ? this.renderPreferences()
      : ''}
    </div>
  }

  renderPreferences () {
    const {t} = this.props

    return <p className='explanation'>
      <span className='app-version'>
      {versionString()}
      </span>
      <span className='proxy-settings'>
        {t('preferences.proxy_server_address')}
        {needle.proxy
          ? <span className='value hint--right' data-hint={t(`preferences.proxy_server_source.${needle.proxySource}`)}>
            {needle.proxy}
          </span>
          : <span className='value'>
            {t('preferences.proxy_server_source.direct')}
          </span>
        }
      </span>
      <span className='link' onClick={(e) => { e.preventDefault(); shell.openItem(getAppLogPath()) }}>
        {t('preferences.advanced.open_app_log')}
      </span>
    </p>
  }

  onLanguageChange (lang) {
    const {updatePreferences} = this.props
    if (lang === '__') {
      lang = null
    }

    updatePreferences({lang})
  }

  installLocationTable () {
    const {t, navigate} = this.props
    const {addInstallLocationRequest,
      removeInstallLocationRequest, makeInstallLocationDefault} = this.props

    const header = <tr className='header'>
      <td>{t('preferences.install_location.path')}</td>
      <td>{t('preferences.install_location.used_space')}</td>
      <td>{t('preferences.install_location.free_space')}</td>
      <td></td>
      <td></td>
    </tr>

    const {installLocations = {}} = this.props
    const {aliases, defaultLoc = 'appdata', locations = []} = installLocations

    // can't delete your last remaining location.
    const severalLocations = locations.length > 0

    let rows = []
    rows.push(header)

    locations::each((location) => {
      const {name} = location
      const isDefault = (name === defaultLoc)
      const mayDelete = severalLocations && name !== 'appdata'

      let {path} = location
      for (const alias of aliases) {
        path = path.replace(alias[0], alias[1])
      }
      const {size, freeSpace} = location
      const rowClasses = classNames({
        ['default']: isDefault
      })

      rows.push(<tr className={rowClasses} key={`location-${name}`}>
        <td className='action path' onClick={(e) => makeInstallLocationDefault(name)}>
          <div className='default-switch hint--right' data-hint={t('preferences.install_location.' + (isDefault ? 'is_default' : 'make_default'))}>
            <span className='single-line'>{path}</span>
          </div>
        </td>
        <td> {humanize.fileSize(size)} </td>
        <td> {freeSpace > 0 ? humanize.fileSize(freeSpace) : '...'} </td>
        <td className='action' onClick={(e) => { e.preventDefault(); navigate(`locations/${name}`) }}>
          <Icon icon='folder-open'/>
        </td>

        {mayDelete
          ? <td className='action delete hint--top' data-hint={t('preferences.install_location.delete')} onClick={(e) => removeInstallLocationRequest(name)}>
            <Icon icon='cross'/>
          </td>
          : <td/>
        }
      </tr>)
    })

    rows.push(<tr>
      <td className='action add-new' onClick={(e) => { e.preventDefault(); addInstallLocationRequest() }}>
        <Icon icon='plus'/>
        {t('preferences.install_location.add')}
      </td>
    </tr>)

    return <table className='install-locations'>
      <tbody>{rows}</tbody>
    </table>
  }
}

Preferences.propTypes = {
  locales: PropTypes.array.isRequired,
  preferences: PropTypes.object.isRequired,
  downloading: PropTypes.bool.isRequired,
  sniffedLang: PropTypes.string,
  lang: PropTypes.string.isRequired,
  t: PropTypes.func.isRequired,
  installLocations: PropTypes.object.isRequired,

  browseInstallLocation: PropTypes.func.isRequired,
  addInstallLocationRequest: PropTypes.func.isRequired,
  removeInstallLocationRequest: PropTypes.func.isRequired,
  makeInstallLocationDefault: PropTypes.func.isRequired,
  queueLocaleDownload: PropTypes.func.isRequired,
  updatePreferences: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  preferences: (state) => state.preferences,
  downloading: (state) => Object.keys(state.i18n.downloading).length > 0,
  lang: (state) => state.i18n.lang,
  locales: (state) => state.i18n.locales,
  sniffedLang: (state) => state.system.sniffedLang,
  isolateApps: (state) => state.preferences.isolateApps,
  closeToTray: (state) => state.preferences.closeToTray,
  showAdvanced: (state) => state.preferences.showAdvanced,
  installLocations: createSelector(
    (state) => state.preferences.installLocations,
    (state) => state.preferences.defaultInstallLocation,
    (state) => state.globalMarket.caves,
    (state) => state.system.homePath,
    (state) => state.system.userDataPath,
    (state) => state.system.diskInfo,
    (locInfos, defaultLoc, caves, homePath, userDataPath, diskInfo) => {
      if (!locInfos || !caves) {
        return {}
      }

      locInfos = {
        ...locInfos,
        appdata: {
          path: path.join(userDataPath, 'apps')
        }
      }

      const locations = locInfos::map((locInfo, name) => {
        if (locInfo.deleted) {
          return
        }

        const isAppData = (name === 'appdata')

        let itemCount = 0
        let size = 0
        caves::each((cave) => {
          // TODO: handle per-user appdata ?
          if (cave.installLocation === name || (isAppData && !cave.installLocation)) {
            size += (cave.installedSize || 0)
            itemCount++
          }
        })

        return {
          ...locInfo,
          name,
          freeSpace: diskspace.freeInFolder(diskInfo, locInfo.path),
          itemCount,
          size
        }
      })::filter((x) => !!x)

      return {
        locations,
        aliases: [
          [homePath, '~']
        ],
        defaultLoc
      }
    }
  )
})

const mapDispatchToProps = (dispatch) => ({
  queueLocaleDownload: (lang) => dispatch(actions.queueLocaleDownload({lang})),
  navigate: (path, data) => dispatch(actions.navigate(path, data)),
  addInstallLocationRequest: () => dispatch(actions.addInstallLocationRequest()),
  makeInstallLocationDefault: (name) => dispatch(actions.makeInstallLocationDefault({name})),
  removeInstallLocationRequest: (name) => dispatch(actions.removeInstallLocationRequest({name})),
  updatePreferences: (data) => dispatch(actions.updatePreferences(data))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Preferences)
