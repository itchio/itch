import reset from "renderer/global-styles/reset";
import base from "renderer/global-styles/base";
import scroll from "renderer/global-styles/scroll";
import hint from "renderer/global-styles/hint";

import { injectGlobal } from "renderer/styles";

export function inject() {
  injectGlobal`
    ${reset}
    ${base}
    ${scroll}
    ${hint}
  `;
}
