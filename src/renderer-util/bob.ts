/**
 * bob is an artist. he knows colors
 * most importantly, he knows how to extract dominant colors
 * from an image, thanks to a little help from his friends.
 */

import * as colorgram from "colorgram";
import * as tinycolor from "tinycolor2";
import { sortBy, filter } from "underscore";

const width = 400;
const PRINT_COLORS = !!process.env.IAMA_RAINBOW_AMA;

const cache = {} as ICache;

/**
 * RGB values as a 3-element array of numbers in the [0, 255] range
 */
export interface IRGBColor {
  [componentIndex: number]: number;
}

type IPalette = IRGBColor[];

interface IDominantColorCallback {
  (pal: IPalette): void;
}

interface ICache {
  [path: string]: IPalette;
}

const bob = {
  /** Finds the color palette for an image */
  extractPalette: function(path: string, done: IDominantColorCallback) {
    if (!path) {
      return;
    }

    if (cache[path]) {
      return done(cache[path]);
    }

    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = width * (img.height / img.width);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, canvas.height);
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const image = {
        width: canvas.width,
        height: canvas.height,
        data: id.data,
        channels: 4,
        canvas: canvas,
      };
      const palette = colorgram.extract(image);
      cache[path] = palette;
      done(palette);
    };
    img.src = path;
  },

  /** Converts an IRGBColor to css */
  toCSS: function(c: IRGBColor): string {
    return c ? `rgb(${c[0]}, ${c[1]}, ${c[2]})` : null;
  },

  /** Converts an IRGBColor to css, with specified alpha value */
  toCSSAlpha: function(c: IRGBColor, a: number): string {
    return c ? `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${a})` : null;
  },

  /** Given a palette, picks a 'good' color to display - hopefully a bright saturated one */
  pick: function(palette: IPalette): IRGBColor {
    const colors = palette.map(c => ({
      rgb: c,
      hsl: tinycolor({ r: c[0], g: c[1], b: c[2] }).toHsl(),
    }));

    const picked = filter(colors, c => c.hsl.l > 0.5 && c.hsl.l < 0.7);

    if (PRINT_COLORS) {
      console.log("picked colors: ", picked.length);
      picked.forEach(c => {
        console.log(`%c ${JSON.stringify(c)}`, `color: ${bob.toCSS(c.rgb)}`);
      });
    }

    if (picked.length > 0) {
      const sorted = sortBy(picked.slice(0, 2), c => -c.hsl.s);

      if (PRINT_COLORS) {
        console.log("sorted colors: ", sorted.length);
        sorted.forEach(c => {
          console.log(`%c ${JSON.stringify(c)}`, `color: ${bob.toCSS(c.rgb)}`);
        });
      }
      return sorted[0].rgb;
    }
  },
};

export default bob;
