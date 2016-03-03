
import test from 'zopf'
import sd from './skin-deeper'

import PreferencesForm from '../../app/components/preferences-form'

test('PreferencesForm', t => {
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
