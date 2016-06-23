
import os from './os'
import {camelify} from './format'

const platform = os.itchPlatform()
const platformProp = camelify('p_' + platform)

export default function isPlatformCompatible (game) {
  return !!game[platformProp] || game.type === 'html'
}
