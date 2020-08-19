import { isDate } from "underscore";

// regexps are generally slow,
export function camelify(str: string): string {
  return str.replace(/_[a-z]/g, (x) => x[1].toUpperCase());
}

export function camelifyObject(obj: any): any {
  if (obj && typeof obj === "object") {
    if (Array.isArray(obj)) {
      const res = Array(obj.length);
      for (let i = 0; i < obj.length; i++) {
        res[i] = camelifyObject(obj[i]);
      }
      return res;
    } else if (isDate(obj)) {
      return obj;
    } else {
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return obj;
      }

      const res: any = {};
      for (const key of keys) {
        res[camelify(key)] = camelifyObject(obj[key]);
      }
      return res;
    }
  } else {
    return obj;
  }
}
