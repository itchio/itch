
import React, {Component, PropTypes} from 'react'
import {createSelector, createStructuredSelector} from 'reselect'
import {connect} from './connect'

import path from 'path'
import humanize from 'humanize-plus'

import urls from '../constants/urls'

import Icon from './icon'
import SelectRow from './select-row'

import * as actions from '../actions'

import {map, each, filter} from 'underline'

import os from '../util/os'
import diskspace from '../util/diskspace'
const platform = os.itchPlatform()

function browseI18nKey () {
  let fallback = 'grid.item.open_in_file_explorer'
  switch (platform) {
    case 'osx': return ['grid.item.open_in_file_explorer_osx', fallback]
    case 'linux': return ['grid.item.open_in_file_explorer_linux', fallback]
    default: return fallback
  }
}

export class Preferences extends Component {
  render () {
    const {t, lang, sniffedLang, downloading, locales} = this.props
    const {queueLocaleUpdate} = this.props

    const options = [{
      value: '__',
      label: t('preferences.language.auto', {language: sniffedLang})
    }].concat(locales)

    return <div className='preferences-meat'>
      <form className='form preferences-form'>
        <SelectRow onChange={::this.onLanguageChange} options={options} value={lang || '__'} label={t('preferences.language')}/>

        <div className='locale-fetcher' onClick={(e) => { e.preventDefault(); queueLocaleUpdate(lang) }}>
        {downloading
          ? <Icon icon='stopwatch' classes='scan'/>
          : <Icon icon='refresh'/>
        }
        </div>

        <div className='get-involved'>
          <a href={urls.itchTranslationPlatform}>
            <Icon icon='earth'/>
            {t('preferences.language.get_involved', {name: 'itch'})}
          </a>
        </div>

        <p className='install-locations-header'>{t('preferences.install_locations')}</p>
        {this.installLocationTable()}
      </form>
    </div>
  }

  onLanguageChange (lang) {
    const {updatePreferences} = this.props
    updatePreferences({lang})
  }

  installLocationTable () {
    const {t, navigate} = this.props
    const {browseInstallLocation, addInstallLocationRequest,
      removeInstallLocationRequest, makeInstallLocationDefault} = this.props

    const header = <tr>
      <th>{t('preferences.install_location.path')}</th>
      <th>{t('preferences.install_location.used_space')}</th>
      <th>{t('preferences.install_location.free_space')}</th>
      <th>{t('preferences.install_location.item_count')}</th>
      <th/>
      <th/>
      <th/>
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
      const {size, freeSpace, itemCount} = location

      rows.push(<tr>
        <td className='action' onClick={(e) => { e.preventDefault(); navigate(`locations/${name}`) }}>
          <Icon icon='folder'/> {path}
        </td>
        <td> {humanize.fileSize(size)} </td>
        <td> {freeSpace > 0 ? humanize.fileSize(freeSpace) : '...'} </td>
        <td className='action' onClick={(e) => { e.preventDefault(); navigate(`locations/${name}`) }}>
        {itemCount > 0
          ? itemCount
          : <span className='empty'>0</span>
        }
        </td>

        {isDefault
          ? <td className='action default hint--top' data-hint={t('preferences.install_location.is_default')}>
            <Icon icon='star'/>
          </td>
          : <td className='action not_default hint--top' data-hint={t('preferences.install_location.make_default')} onClick={(e) => makeInstallLocationDefault(name)}>
            <Icon icon='star'/>
          </td>
        }

        <td className='action hint--top' data-hint={t(browseI18nKey())} onClick={(e) => browseInstallLocation(name)}>
          <Icon icon='folder-open'/>
        </td>

        {mayDelete
          ? <td className='action hint--top' data-hint={t('preferences.install_location.delete')} onClick={(e) => removeInstallLocationRequest(name)}>
            <Icon icon='cross'/>
          </td>
          : <td/>
        }
      </tr>)
    })

    rows.push(<tr className='borderless'>
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
  locales: PropTypes.object.isRequired,
  preferences: PropTypes.object.isRequired,
  downloading: PropTypes.bool.isRequired,
  sniffedLang: PropTypes.string.isRequired,
  lang: PropTypes.string.isRequired,
  t: PropTypes.func.isRequired,
  installLocations: PropTypes.object.isRequired,

  browseInstallLocation: PropTypes.func.isRequired,
  addInstallLocationRequest: PropTypes.func.isRequired,
  removeInstallLocationRequest: PropTypes.func.isRequired,
  makeInstallLocationDefault: PropTypes.func.isRequired,
  queueLocaleUpdate: PropTypes.func.isRequired,
  updatePreferences: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired
}

const mapStateToProps = createStructuredSelector({
  preferences: (state) => state.preferences,
  downloading: (state) => Object.keys(state.i18n.downloading).length > 0,
  lang: (state) => state.i18n.lang,
  locales: (state) => state.i18n.locales,
  sniffedLang: (state) => state.system.sniffedLang,
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
  queueLocaleUpdate: (lang) => dispatch(actions.queueLocaleUpdate({lang})),
  navigate: (path, data) => dispatch(actions.navigate(path, data)),
  addInstallLocationRequest: () => dispatch(actions.addInstallLocationRequest()),
  makeInstallLocationDefault: (name) => dispatch(actions.makeInstallLocationDefault({name})),
  removeInstallLocationRequest: (name) => dispatch(actions.removeInstallLocationRequest({name})),
  browseInstallLocation: (name) => dispatch(actions.browseInstallLocation({name})),
  updatePreferences: (data) => dispatch(actions.updatePreferences(data))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Preferences)
