import { createGlobalStyle } from "styled-components";
import reset from "renderer/global-styles/reset";
import base from "renderer/global-styles/base";
import scroll from "renderer/global-styles/scroll";

const GlobalStyles = createGlobalStyle`
    ${reset}
    ${base}
    ${scroll}
`;

export default GlobalStyles;
