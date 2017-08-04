import { IConfigureResult } from "../util/butler";

import { fileSize } from "./filesize";

const emptyArr = [];

export function formatVerdict(input: IConfigureResult) {
  const result = [];
  result.push(`| ${fileSize(input.totalSize)} ${input.basePath}`);

  const candidates = input.candidates || emptyArr;
  for (const c of candidates) {
    let line = `|-- ${fileSize(c.size)} ${c.path} ${c.flavor}-${c.arch}`;

    const append = (label: string, input: any) => {
      if (!input) {
        return;
      }

      const values = [];

      for (const k of Object.keys(input)) {
        const v = input[k];
        if (v === true) {
          values.push(k);
        } else {
          values.push(`${k}=${v}`);
        }
      }

      line += ` ${label}(${values.join(" ")})`;
    };
    append("win", c.windowsInfo);
    append("sh", c.scriptInfo);

    result.push(line);
  }

  return result.join("\n");
}
