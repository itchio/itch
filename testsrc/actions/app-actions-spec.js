
import test from 'zopf'
import proxyquire from 'proxyquire'

import {each} from 'underline'
import electron from '../stubs/electron'

test('app-actions', t => {
  let app_dispatcher = {
    __esModule: true,
    default: {
      dispatch: () => null
    }
  }
  let stubs = Object.assign({
    '../dispatcher/app-dispatcher': app_dispatcher
  }, electron)
  let AppActions = proxyquire('../../app/actions/app-actions', stubs).default

  let test_action = (name, args, object) => {
    t.case(name, t => {
      t.mock(app_dispatcher.default).expects('dispatch').withArgs(object)
      AppActions[name].apply(AppActions, args)
    })
  }

  test_action('boot', [], { action_type: 'BOOT' })
  test_action('open_url', ['itch.io'], { action_type: 'OPEN_URL', url: 'itch.io' })

  test_action('window_ready', [], { action_type: 'WINDOW_READY' })

  test_action('setup_status', ['All good', 'thumbs-up', {a: 'b'}],
    { action_type: 'SETUP_STATUS', message: 'All good', icon: 'thumbs-up', variables: {a: 'b'} })
  test_action('setup_wait', [], { action_type: 'SETUP_WAIT' })
  test_action('setup_done', [], { action_type: 'SETUP_DONE' })

  test_action('focus_window', [], { action_type: 'FOCUS_WINDOW' })
  test_action('hide_window', [], { action_type: 'HIDE_WINDOW' })

  test_action('focus_panel', ['waz'], { action_type: 'LIBRARY_FOCUS_PANEL', panel: 'waz' })

  test_action('check_for_self_update', [], { action_type: 'CHECK_FOR_SELF_UPDATE' })
  test_action('checking_for_self_update', [], { action_type: 'CHECKING_FOR_SELF_UPDATE' })
  test_action('self_update_available', [], { action_type: 'SELF_UPDATE_AVAILABLE' })
  test_action('self_update_not_available', [], { action_type: 'SELF_UPDATE_NOT_AVAILABLE' })
  test_action('self_update_error', ['no internet'], { action_type: 'SELF_UPDATE_ERROR', message: 'no internet' })
  test_action('self_update_downloaded', ['v49.0'], { action_type: 'SELF_UPDATE_DOWNLOADED', version: 'v49.0' })
  test_action('apply_self_update', [], { action_type: 'APPLY_SELF_UPDATE' })
  test_action('apply_self_update_for_realsies', [], { action_type: 'APPLY_SELF_UPDATE_FOR_REALSIES' })
  test_action('dismiss_status', [], { action_type: 'DISMISS_STATUS' })

  test_action('locale_update_queue_download', ['zh'], { action_type: 'LOCALE_UPDATE_QUEUE_DOWNLOAD', lang: 'zh' })
  test_action('locale_update_downloaded', ['zh', {a: 'b'}], { action_type: 'LOCALE_UPDATE_DOWNLOADED', lang: 'zh', resources: {a: 'b'} })
  test_action('locale_update_download_start', ['zh'], { action_type: 'LOCALE_UPDATE_DOWNLOAD_START', lang: 'zh' })
  test_action('locale_update_download_end', ['zh'], { action_type: 'LOCALE_UPDATE_DOWNLOAD_END', lang: 'zh' })

  test_action('no_stored_credentials', [], { action_type: 'NO_STORED_CREDENTIALS' })
  test_action('attempt_login', [], { action_type: 'ATTEMPT_LOGIN' })
  test_action('login_with_password', ['might', 'magic'], { action_type: 'LOGIN_WITH_PASSWORD', username: 'might', password: 'magic', private: true })
  test_action('login_failure', [['might', 'magic']], { action_type: 'LOGIN_FAILURE', errors: ['might', 'magic'] })

  test_action('authenticated', [], { action_type: 'AUTHENTICATED' })
  test_action('ready_to_roll', [], { action_type: 'READY_TO_ROLL' })
  test_action('locations_ready', [], { action_type: 'LOCATIONS_READY' })
  test_action('change_user', [], { action_type: 'CHANGE_USER' })
  test_action('logout', [], { action_type: 'LOGOUT' })

  test_action('compute_install_location_size', ['uuid'], { action_type: 'COMPUTE_INSTALL_LOCATION_SIZE', name: 'uuid' })
  test_action('cancel_install_location_size_computation', ['uuid'], { action_type: 'CANCEL_INSTALL_LOCATION_SIZE_COMPUTATION', name: 'uuid' })
  test_action('browse_install_location', ['uuid'], { action_type: 'BROWSE_INSTALL_LOCATION', name: 'uuid' })
  test_action('add_install_location_request', [], { action_type: 'ADD_INSTALL_LOCATION_REQUEST' })
  test_action('add_install_location', ['uuid', '/dev/itch'], { action_type: 'ADD_INSTALL_LOCATION', name: 'uuid', path: '/dev/itch' })
  test_action('remove_install_location_request', ['uuid'], { action_type: 'REMOVE_INSTALL_LOCATION_REQUEST', name: 'uuid' })
  test_action('remove_install_location', ['uuid'], { action_type: 'REMOVE_INSTALL_LOCATION', name: 'uuid' })
  test_action('transfer_install_location', ['uuid', '/tmp/itch'], { action_type: 'TRANSFER_INSTALL_LOCATION', name: 'uuid', new_path: '/tmp/itch' })
  test_action('make_install_location_default', ['uuid'], { action_type: 'MAKE_INSTALL_LOCATION_DEFAULT', name: 'uuid' })

  test_action('request_cave_uninstall', ['uuid'], { action_type: 'REQUEST_CAVE_UNINSTALL', id: 'uuid' })
  test_action('queue_cave_uninstall', ['uuid'], { action_type: 'QUEUE_CAVE_UNINSTALL', id: 'uuid' })
  test_action('queue_cave_reinstall', ['uuid'], { action_type: 'QUEUE_CAVE_REINSTALL', id: 'uuid' })
  test_action('update_cave', ['uuid', {a: 'b'}], { action_type: 'UPDATE_CAVE', id: 'uuid', cave: {a: 'b'} })
  test_action('cave_progress', [{id: 'uuid', a: 'b'}], { action_type: 'CAVE_PROGRESS', data: {id: 'uuid', a: 'b'} })
  test_action('cancel_cave', ['uuid'], { action_type: 'CANCEL_CAVE', id: 'uuid' })
  test_action('implode_cave', ['uuid'], { action_type: 'IMPLODE_CAVE', id: 'uuid' })
  test_action('explore_cave', ['uuid'], { action_type: 'EXPLORE_CAVE', id: 'uuid' })
  test_action('cave_thrown_into_bit_bucket', ['uuid'], { action_type: 'CAVE_THROWN_INTO_BIT_BUCKET', id: 'uuid' })
  test_action('probe_cave', ['uuid'], { action_type: 'PROBE_CAVE', id: 'uuid' })
  test_action('report_cave', ['uuid'], { action_type: 'REPORT_CAVE', id: 'uuid' })

  test_action('show_packaging_policy', ['deb', 123], { action_type: 'SHOW_PACKAGING_POLICY', format: 'deb', game_id: 123 })

  test_action('queue_game', [{name: 'Downwell'}], { action_type: 'QUEUE_GAME', game: {name: 'Downwell'} })
  test_action('browse_game', [123, 'itch.io'], { action_type: 'BROWSE_GAME', id: 123, url: 'itch.io' })
  test_action('initiate_purchase', [{name: 'Upsquid'}], { action_type: 'INITIATE_PURCHASE', game: {name: 'Upsquid'} })
  test_action('purchase_completed', [123, 'thanks!'], { action_type: 'PURCHASE_COMPLETED', id: 123, message: 'thanks!' })

  test_action('set_progress', [0.5], { action_type: 'SET_PROGRESS', alpha: 0.5 })
  test_action('bounce', [], { action_type: 'BOUNCE' })
  test_action('notify', ['les carottes sont cuites'], { action_type: 'NOTIFY', message: 'les carottes sont cuites' })

  test_action('fetch_games', ['collections/23498'], { action_type: 'FETCH_GAMES', path: 'collections/23498' })
  test_action('fetch_collections', [], { action_type: 'FETCH_COLLECTIONS' })
  test_action('fetch_search', ['baz'], { action_type: 'FETCH_SEARCH', query: 'baz' })
  test_action('search_fetched', ['baz'], { action_type: 'SEARCH_FETCHED', query: 'baz' })

  test_action('eval', ['alert("Hi")'], { action_type: 'EVAL', code: 'alert("Hi")' })

  test_action('open_preferences', [], { action_type: 'OPEN_PREFERENCES' })
  test_action('preferences_set_language', ['en'], { action_type: 'PREFERENCES_SET_LANGUAGE', language: 'en' })
  test_action('preferences_set_sniffed_language', ['zh'], { action_type: 'PREFERENCES_SET_SNIFFED_LANGUAGE', language: 'zh' })

  test_action('quit', [], { action_type: 'QUIT' })
  test_action('quit_when_main', [], { action_type: 'QUIT_WHEN_MAIN' })

  test_action('gain_focus', [], { action_type: 'GAIN_FOCUS' })

  ;['game_store', 'cave_store', 'install_location_store']::each((prefix) => {
    test_action(prefix + '_diff', [[8, 7, 1]], { action_type: (prefix + '_DIFF').toUpperCase(), diff: [8, 7, 1] })
  })
  test_action('cave_store_cave_diff', ['kalamazoo', [8, 7, 1]],
    { action_type: 'CAVE_STORE_CAVE_DIFF', cave_id: 'kalamazoo', diff: [8, 7, 1] })

  test_action('implode_app', [], { action_type: 'IMPLODE_APP' })
})
