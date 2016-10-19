
export {Schema, arrayOf} from "idealizr";

import {normalize as underNormalize} from "idealizr";
import {camelifyObject} from "./format";

export function normalize (res: any, spec: any): any {
  return camelifyObject(underNormalize(res, spec));
};
