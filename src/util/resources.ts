
import {resolve} from "path";

export function getImagePath (path: string): string {
  const resourcePath = "../static/images/" + path;
  return resolve(__dirname, resourcePath);
}

export function getLocalePath (path: string): string {
  const resourcePath = "../static/locales/" + path;
  return resolve(__dirname, resourcePath);
}

export function getLocalesConfigPath (): string {
  let resourcePath = "../static/locales.json";
  return resolve(__dirname, resourcePath);
}

type IInjectName = "itchio-monkeypatch" | "game";

export function getInjectPath(name: IInjectName) {
  return resolve(__dirname, "inject", name + ".js");
}
