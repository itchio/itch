
import * as env from "../env";

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = env.name;
} else {
  // typescript doesn't like us writing to a module
  // maybe it's right? seems like it works fine for us though.
  (env as any).name = process.env.NODE_ENV;
}
