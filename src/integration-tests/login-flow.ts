
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
    await client.waitForVisible("#user-menu", 20 * 1000);
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

  // now kids this is the REAL integration testing you've been talked about
  t.comment("checking that we're logged in on itch.io too");

  t.comment("opening new tab");
  await t.safeClick("#new-tab-icon");
  await t.safeClick("input.browser-address");
  await client.setValue("input.browser-address", "https://itch.io/login");
  await t.safeClick(".meat-tab.visible .go-button");

  t.comment("checking that we're redirected to the dashboard");
  await client.waitUntilTextExists(".meat-tab.visible .title-bar-text", "Creator Dashboard", 60 * 1000);

  t.comment("now clearing cookies");
  await t.safeClick("#user-menu");
  await t.safeClick("#user-menu-preferences");

  t.comment("expanding advanced preferences");
  await client.scroll("#preferences-advanced-section");
  await t.safeClick("#preferences-advanced-section");

  t.comment("opening clearing browsing data dialog");
  await client.scroll("#clear-browsing-data-link");
  await t.safeClick("#clear-browsing-data-link");

  t.comment("clearing cookies");
  await t.safeClick("#clear-cookies-checkbox");
  await t.safeClick("#modal-clear-data");

  t.comment("opening new tab");
  await t.safeClick("#new-tab-icon");
  await t.safeClick("input.browser-address");
  await client.setValue("input.browser-address", "https://itch.io/login");
  await t.safeClick(".meat-tab.visible .go-button");

  t.comment("checking that we've landed on the login page");
  await client.waitUntilTextExists(".meat-tab.visible .title-bar-text", "Log in", 60 * 1000);

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
