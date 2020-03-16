import * as fs from "fs";

export async function readFile(
  path: string,
  encoding: "utf8"
): Promise<string> {
  return await new Promise((resolve, reject) => {
    fs.readFile(path, { encoding }, (err, data) => {
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

export async function writeFile(
  path: string,
  data: String,
  encoding: "utf8"
): Promise<void> {
  return await new Promise((resolve, reject) => {
    fs.writeFile(path, data, { encoding }, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function writeJSONFile<T>(
  path: string,
  contents: T
): Promise<void> {
  await writeFile(path, JSON.stringify(contents), "utf8");
}

export async function symlink(target: string, path: string): Promise<void> {
  await new Promise((resolve, reject) => {
    fs.symlink(target, path, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function unlink(path: string): Promise<void> {
  await new Promise((resolve, reject) => {
    fs.unlink(path, err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export async function exists(path: string): Promise<boolean> {
  return await new Promise((resolve, reject) => {
    fs.exists(path, resolve);
  });
}
