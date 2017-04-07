
import {resolve} from "path";

type IInjectName = "itchio-monkeypatch" | "game";

// tslint:disable:no-console

export default function injectPath(name: IInjectName) {
  console.log(`inject-path: __dirname = ${__dirname}`);
  console.log(`inject-path: __filename = ${__filename}`);
  const result = resolve(__dirname, "inject", name + ".js");
  console.log(`inject-path: result = ${result}`);
  return result;
}
