
import * as invariant from 'invariant'
import * as ospath from 'path'

import { shell } from '../../electron'

import pathmaker from '../../util/pathmaker'

import { EventEmitter } from 'events'
import { CaveRecord, ManifestAction } from '../../types/db'

interface LaunchOpts {
  cave: CaveRecord
  manifestAction: ManifestAction
}

export default async function launch(out: EventEmitter, opts: LaunchOpts) {
  const {cave, manifestAction} = opts

  const appPath = pathmaker.appPath(cave)
  const fullPath = ospath.join(appPath, manifestAction.path)
  shell.openItem(fullPath)
}
