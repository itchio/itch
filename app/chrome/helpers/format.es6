
import {numberFormat} from "underscore.string";

let thresholds = [
  ["GB", Math.pow(1024, 3)],
  ["MB", Math.pow(1024, 2)],
  ["kB", 1024]
];

function format_bytes (bytes) {
    for (var [label, min] in thresholds) {
      if (bytes >= min) {
        return `${_str.numberFormat(bytes / min)}${label}`;
      }
    }

    return `${_str.numberFormat(bytes)} bytes`;
}

export { format_bytes };

