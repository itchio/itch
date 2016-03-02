
import test from 'zopf'
import fixture from '../fixture'
import find_uninstallers from '../../app/tasks/install/find-uninstallers'

test('find-uninstallers', async t => {
  let results

  results = await find_uninstallers(fixture.path('uninstallers/pidgin'))
  t.same(results, ['pidgin-uninst.exe'], 'program-uninst.exe')

  results = await find_uninstallers(fixture.path('uninstallers/winvnc'))
  t.same(results, ['unins000.exe', 'unins001.exe'], 'uninsXXX')

  results = await find_uninstallers(fixture.path('uninstallers/fiddler2'))
  t.same(results, ['uninst.exe'], 'uninst.exe in root folder')

  results = await find_uninstallers(fixture.path('uninstallers/videolan'))
  t.same(results, ['vlc/uninstall.exe'], 'uninstall.exe in subfolder')
})
