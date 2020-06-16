import env from "common/env";
import { app } from "electron";

export function makeIndexHTML(): string {
  return `
<!DOCTYPE HTML>
<html>

<head>
  <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
  ${
    env.production
      ? `
  <meta http-equiv="Content-Security-Policy"
    content="default-src 'self' 'unsafe-inline' itch://* ws://127.0.0.1:* https://dale.itch.ovh; style-src 'unsafe-inline' itch://*; img-src 'self' itch://* https://img.itch.zone https://weblate.itch.ovh">
`
      : ""
  }
  <title>itch</title>
  <link rel="stylesheet" href="/renderer/fonts/icomoon/style.css">
  <link rel="stylesheet" href="/renderer/fonts/lato/latofonts-custom.css">
  <link rel="stylesheet" href="/node_modules/tippy.js/dist/tippy.css">
  <script>
  (function() {
    require("module").globalPaths.push(${JSON.stringify(app.getAppPath())});
    require("lib/${env.name}/renderer")
  })();
  </script>
  <style>
    #app {
      min-height: 100%;
    }
  </style>
</head>

<body>
  <div id="app"></div>
</body>

</html>
`;
}
