
import test from 'zopf'
import proxyquire from 'proxyquire'

import sd from './skin-deeper'
import stubs from '../stubs/react-stubs'

test('PreferencesForm', t => {
  const PreferencesForm = proxyquire('../../app/components/preferences-form', stubs).default
  const appdata = {
    name: 'appdata',
    size: -1,
    free_space: 202006237184,
    item_count: 0,
    computing_size: false,
    path: ''
  }
  const state = {
    install_locations: {
      aliases: [
        ['', '~']
      ],
      default: 'appdata',
      locations: { appdata }
    }
  }

  const tree = sd.shallowRender(sd(PreferencesForm, { state }))
  let instance = tree.getMountedInstance()
  // TODO: finish writing test
  instance = instance
})
