import { ISchema, INormalized, normalize as underNormalize } from "idealizr";
import { camelify } from "../format";

export default function normalize(input: any, schema: ISchema): INormalized {
  return underNormalize(input, schema, {
    keyTransformer: camelify,
  });
}
