
import {
  IIntegrationTest,
} from "./types";

const currTab = ".meat-tab[data-visible=true] ";

export default async function navigationFlow (t: IIntegrationTest) {
  const {client} = t.app;

  await client.waitForExist("#user-menu");

  t.comment("navigating to dashboard");
  await t.safeClick("section[data-path=dashboard]");

  await client.waitForExist(".meat-tab[data-id=dashboard] .layout-picker");
  await t.safeClick(currTab + ".layout-picker[data-layout='grid']");

  t.comment("clearing filters if any");
  try {
    await t.safeClick(currTab + ".indicator-clear-filters");
  } catch (e) {
    // no filters to clear or whatever, it's ok
  }

  t.comment("checking grid is shown");
  await client.waitForVisible(currTab + ".grid-item");

  t.comment("switching to table layout");
  await t.safeClick(currTab + ".layout-picker[data-layout='table']");

  t.comment("checking table is shown");
  await client.waitForVisible(currTab + ".table-item");

  const firstTitleSelector = currTab + ".table-item:first-child .game-table-title";

  t.comment("sorting by name, A-Z");
  await t.safeClick(currTab + "[role='columnheader'][aria-label='table.column.name']");
  t.comment("ensuring the A-Z sorting is correct");
  await client.waitUntilTextExists(firstTitleSelector, "111 first");

  t.comment("sorting by name, Z-A");
  await t.safeClick(currTab + "[role='columnheader'][aria-label='table.column.name']");
  t.comment("ensuring the Z-A sorting is correct");
  await client.waitUntilTextExists(firstTitleSelector, "zzz last");
  
  throw new Error(`SYKE`);
}
