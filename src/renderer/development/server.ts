import { createServer } from "http";

export function install() {
  let port = process.env.ITCH_REFRESH_PORT;
  if (!port) {
    console.warn("$ITCH_REFRESH_PORT not set, not installing server");
    return;
  }

  let reqPath = "renderer/refresh-test";

  const server = createServer((req, res) => {
    (async () => {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }
      console.log("Request body: ", body);

      res.writeHead(200);
      res.end("Hi there");

      console.log(`Refreshing ${reqPath}`);
      delete require.cache[require.resolve(reqPath)];
      let m = require(reqPath);
      console.log(`m = `, m.default);
    })().catch((e) => console.warn(`Dev server error: `, e.stack));
  });
  server.listen(parseInt(port, 10));
}
