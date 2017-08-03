import { randomBytes } from "crypto";

// avert your eyes tslint, this isn't for you
// tslint:disable

/**
 * Generates an uuid v4 (random)
 * taken from https://gist.github.com/jed/982883
 */
function b(
  a?, // placeholder
) {
  return a // if the placeholder was passed, return
    ? // a random number from 0 to 15
      (a ^ // unless b is 8,
        ((randomBytes(1)[0] % // in which case
          16) >> // a random number from
          (a / 4))) // 8 to 11
        .toString(16) // in hexadecimal
    : // or otherwise a concatenated string:
      (([1e7] as any) + // 10000000 +
      -1e3 + // -1000 +
      -4e3 + // -4000 +
      -8e3 + // -80000000 +
        -1e11) // -100000000000,
        .replace(
          // replacing
          /[018]/g, // zeroes, ones, and eights with
          b, // random hex digits
        );
}

export default b;
