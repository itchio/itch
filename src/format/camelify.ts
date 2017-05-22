
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
    } else {
      const res: any = {};
      for (const key in obj) {
        if (!obj.hasOwnPropery(key)) {
          continue;
        }
        res[camelify(key)] = camelifyObject(obj[key]);
      }
      return res;
    }
  } else {
    return obj;
  }
}
