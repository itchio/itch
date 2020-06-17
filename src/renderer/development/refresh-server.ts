import { createServer } from "http";

interface BuildResult {
  changedFiles: string[];
}

export function install() {
  let port = process.env.ITCH_REFRESH_PORT;
  if (!port) {
    console.warn("$ITCH_REFRESH_PORT not set, not installing server");
    return;
  }

  const server = createServer((req, res) => {
    (async () => {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }

      let payload = JSON.parse(body);
      if (payload.kind === "new-build") {
        let result: BuildResult = payload.result;
        for (const file of result.changedFiles) {
          console.log(`Refreshing ${file}`);
          delete require.cache[file];
          require(file);
        }

        const runtime = require("react-refresh/runtime");
        let refreshResults = runtime.performReactRefresh();
        console.debug("Refresh results", refreshResults);

        res.writeHead(200);
        res.end(`Reloaded ${result.changedFiles.length} files`);
      }

      let m = require("renderer/refresh-test");
      console.log(`m = `, m.default);
    })().catch((e) => console.warn(`Dev server error: `, e.stack));
  });
  server.listen(parseInt(port, 10));
}
