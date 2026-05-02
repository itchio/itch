import { css, theme } from "renderer/styles";

// App-wide keyboard focus styling.
//
// Two goals:
// 1) Mouse clicks shouldn't show a focus ring (UX expectation in desktop
//    apps; browser default does the opposite).
// 2) Keyboard focus must always be obviously visible — and look like our
//    app, not Chromium.
//
// `:focus-visible` gives us the heuristic for free: the browser only
// matches it when the user reached focus via keyboard / programmatic
// means, not via pointer. So we kill the default `:focus` outline
// outright, then re-add a themed outline gated on `:focus-visible`.
//
// We don't apply this to text inputs/textareas — those use their own
// border-color treatment (see `inputTextStyle` in styles.ts).
export default css`
  :focus {
    outline: none;
  }

  button:focus-visible,
  a:focus-visible,
  select:focus-visible,
  summary:focus-visible,
  [role="button"]:focus-visible,
  [tabindex]:focus-visible {
    outline: 2px solid ${theme.accent};
    outline-offset: 2px;
  }
`;
