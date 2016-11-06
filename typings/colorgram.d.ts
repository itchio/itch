
interface ColorgramStatic {
  // no typing because I can't even declaration files
  extract(image: any): any[];
}

declare module 'colorgram' {
  var cg: ColorgramStatic;
  export = cg;
}