
import {
  ISpec,
  testAccountName, testAccountPassword, sleep,
} from "./types";

export default function loginFlow (spec: ISpec) {
  spec("login flow", async (t) => {
    const {client} = t.app;

    t.comment("logging in with invalid credentials");
    await client.setValue("#login-username", "hello this is an integration test");
    await client.setValue("#login-password", "1234");
    await client.click("#login-button");
    await client.waitUntilTextExists("#login-errors", "incorrect_username_or_password");

    if (!testAccountPassword) {
      t.comment("No password in environment, not performing further login tests");
      return;
    }

    t.comment("logging in with valid credentials");
    const loginWithPassword = async () => {
      await client.setValue("#login-username", testAccountName);
      await client.setValue("#login-password", testAccountPassword);
      await client.click("#login-button");
    };
    await loginWithPassword();

    const logout = async ({forReal}) => {
      await client.waitForExist("#user-menu", 5000);
      await client.click("#user-menu");
      await client.waitForExist("#user-menu-change-user", 5000);
      await sleep(200);
      await client.click("#user-menu-change-user");

      if (forReal) {
        await client.waitForExist("#modal-logout", 5000);
        await client.click("#modal-logout");
      } else {
        await client.waitForExist("#modal-cancel", 5000);
        await client.click("#modal-cancel");
      }
    };

    t.comment("doing cancelled logout, then log out for real");
    await logout({forReal: false});
    await logout({forReal: true});

    t.comment("logging back in with remembered sessions");
    await client.waitForExist(".remembered-session", 5000);
    await sleep(200);
    await client.click(".remembered-session");

    t.comment("log out");
    await logout({forReal: true});

    t.comment("forgetting session");
    await client.waitForExist(".remembered-session", 5000);
    await sleep(200);
    await client.moveToObject(".remembered-session");
    await client.waitForVisible(".remembered-session .forget-session", 5000);
    await client.click(".remembered-session .forget-session");
    await sleep(200);
    await client.waitForExist("#modal-forget-session", 5000);
    await client.click("#modal-forget-session");

    t.comment("logging in all over again");
    await loginWithPassword();
    await client.waitForExist("#user-menu", 5000);
  }, {
    wipePrefix: true,
  });
};
