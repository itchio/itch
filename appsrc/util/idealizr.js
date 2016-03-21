
import * as idealizr from 'idealizr'
import {camelifyObject} from './format'

module.exports = {
  ...idealizr,
  normalize: (res, spec) => {
    return camelifyObject(idealizr.normalize(res, spec))
  }
}
