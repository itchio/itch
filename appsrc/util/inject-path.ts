
import {resolve} from "path";

type IInjectName = "itchio-monkeypatch" | "game";

// tslint:disable:no-console

export default function injectPath(name: IInjectName) {
  console.log(`inject-path: __dirname = ${__dirname}`);
  console.log(`inject-path: __filename = ${__filename}`);
  console.log(`inject-path: process.type = ${process.type}`);
  const result = resolve(__dirname, "inject", name);
  console.log(`inject-path: result = ${result}`);
  return result;
}
