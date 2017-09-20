import reset from "./reset";
import base from "./base";
import scroll from "./scroll";
import hint from "./hint";
import modal from "./modal";

import { injectGlobal } from "../styles";

export function inject() {
  injectGlobal`
    ${reset}
    ${base}
    ${scroll}
    ${hint}
    ${modal}
  `;
}
