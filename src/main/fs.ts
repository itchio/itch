import * as fs from "fs";

export async function readFile(
  path: string,
  encoding: "utf8"
): Promise<string> {
  return await new Promise((resolve, reject) => {
    fs.readFile(path, encoding, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

export async function readJSONFile<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf8")) as T;
}
