
import {
  IIntegrationTest,
  testAccountName, testAccountPassword,
} from "./types";

export default async function loginFlow (t: IIntegrationTest) {
  const {client} = t.app;

  t.comment("logging in with invalid credentials");
  await client.setValue("#login-username", "hello this is an integration test");
  await client.setValue("#login-password", "1234");
  await t.safeClick("#login-button");
  await client.waitUntilTextExists("#login-errors", "Incorrect username or password");

  if (!testAccountPassword) {
    t.comment("No password in environment, not performing further login tests");
    return;
  }

  t.comment("logging in with valid credentials");
  const loginWithPassword = async () => {
    await client.setValue("#login-username", testAccountName);
    await client.setValue("#login-password", testAccountPassword);
    await t.safeClick("#login-button");
    await client.waitForVisible("#user-menu", 20000);
  };
  await loginWithPassword();

  const logout = async ({forReal}) => {
    await t.safeClick("#user-menu");
    await t.safeClick("#user-menu-change-user");

    if (forReal) {
      await t.safeClick("#modal-logout");
    } else {
      await t.safeClick("#modal-cancel");
    }
  };

  t.comment("doing cancelled logout");
  await logout({forReal: false});
  t.comment("logging out for real");
  await logout({forReal: true});

  t.comment("logging back in with remembered sessions");
  await t.safeClick(".remembered-session");

  t.comment("logging out for real");
  await logout({forReal: true});

  t.comment("forgetting session");

  await client.waitForVisible(".remembered-session");
  await client.moveToObject(".remembered-session");
  await t.safeClick(".remembered-session .forget-session");
  await t.safeClick("#modal-forget-session");

  t.comment("logging in all over again");
  await loginWithPassword();
};
