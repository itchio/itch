import { ILocalizer } from "../localizer";

enum State {
  normal = 1,
  expectComponentKey,
  expectClose,
}

export type IComponent = JSX.Element | JSX.Element[] | string;

interface IVars {
  [key: string]: string;
}

interface IComponents {
  [key: string]: IComponent;
}

export default function interleave(
  t: ILocalizer,
  key: string,
  components: IComponents,
  textVars: IVars = {},
): IComponent[] {
  if (typeof textVars === "undefined") {
    textVars = {};
  }

  let vars = { ...textVars };
  // source string is something like:
  //
  //   'Click {{button}} to do X'
  //
  // we're trying to turn it into:
  //
  //   'Le bouton [[button]] sert à faire X'
  //
  // and then replace '[[button]]' with the actual component
  // passed to us in components['button']
  for (let componentKey of Object.keys(components)) {
    vars[componentKey] = "[[" + componentKey + "]]";
  }

  const result: IComponent[] = [];
  const translated = t(key, vars);
  // example: ["Click on ", "[[", "report", "]]", " or ", "[[", "probe", "]]", ""]
  const tokens = translated.split(/(\[\[|\]\])/);

  let state = State.normal;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (state === State.normal) {
      if (token === "[[") {
        state = State.expectComponentKey;
      } else {
        if (token.length) {
          result.push(token);
        }
      }
    } else if (state === State.expectComponentKey) {
      result.push(components[token]);
      state = State.expectClose;
    } else if (state === State.expectClose) {
      if (token !== "]]") {
        let msg =
          `Expected closing tag at ${i}, got '${token}' instead. ` +
          `All tokens = ${JSON.stringify(tokens, null, 2)}`;
        throw new Error(msg);
      }
      state = State.normal;
    }
  }

  return result;
}
