
export {Schema, arrayOf} from "idealizr";

import {Schema, normalize as underNormalize} from "idealizr";
import {camelifyObject} from "./format";

export function normalize (res: any, spec: Schema): any {
  return camelifyObject(underNormalize(res, spec));
};
