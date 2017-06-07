
import {ISpec} from "./types";
import * as bluebird from "bluebird";

export default function (spec: ISpec) {
  spec("it runs unit tests", async (t) => {
    t.ownExit = true;
  }, {
    args: ["--run-unit-tests"],
  });

  spec("it shows an initial window", async (t) => {
    const numWindows = await t.app.client.getWindowCount();
    t.is(numWindows, 1);
  });

  spec("it shows login failure", async (t) => {
    const {client} = t.app;
    await client.setValue("#login-username", "hello this is an integration test");
    await client.setValue("#login-password", "1234");
    await client.click("#login-button");
    await client.waitUntilTextExists("#login-errors", "incorrect_username_or_password");
    await bluebird.delay(2000);
  });
}
