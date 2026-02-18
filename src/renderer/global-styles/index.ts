import { createGlobalStyle } from "renderer/styles";
import reset from "renderer/global-styles/reset";
import base from "renderer/global-styles/base";
import scroll from "renderer/global-styles/scroll";
import hint from "renderer/global-styles/hint";
import tabs from "renderer/global-styles/tabs";

export default createGlobalStyle`
    ${reset}
    ${base}
    ${scroll}
    ${hint}
    ${tabs}
`;
