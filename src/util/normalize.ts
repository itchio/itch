
import {ISchema, normalize as underNormalize} from "idealizr";
import {camelify} from "./format";

export default function normalize(schema: ISchema, input: any): any {
  return underNormalize(input, schema, {
    keyTransformer: camelify,
  });
};
