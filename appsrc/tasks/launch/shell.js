
import invariant from 'invariant'
import ospath from 'path'

import {shell} from '../../electron'

import pathmaker from '../../util/pathmaker'

export default async function launch (out, opts) {
  const {cave, manifestAction} = opts
  invariant(cave, 'launch/shell has cave')
  invariant(manifestAction, 'launch/shell has manifestAction')
  invariant(typeof manifestAction.path === 'string', 'launch/shell has manifestAction path')

  const appPath = pathmaker.appPath(cave)
  const fullPath = ospath.join(appPath, manifestAction.path)
  shell.openItem(fullPath)
}
