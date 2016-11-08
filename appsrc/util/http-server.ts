
import * as serveStatic from "serve-static";
import * as finalhandler from "finalhandler";
import * as http from "http";

let self = {
  create: (fileRoot: string, opts: any): http.Server => {
    let serve = serveStatic(fileRoot, opts);
    let server = http.createServer((req, res) => {
      let done = finalhandler(req, res);
      serve(req, res, done);
    });
    server.listen(0); // let node/os assign random port

    return server;
  },
};

export default self;
