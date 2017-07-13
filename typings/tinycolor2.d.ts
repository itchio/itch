interface HSLColor {
  h: number;
  s: number;
  l: number;
}

interface RGBColor {
  r: number;
  g: number;
  b: number;
}

interface TinyColor {
  toHsl(): HSLColor;
}

interface TinyColorStatic {
  (c: RGBColor): TinyColor;
}

/**
 * Typings for https://bgrins.github.com/TinyColor
 */
declare module "tinycolor2" {
  var tc: TinyColorStatic;
  export = tc;
}
