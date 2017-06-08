
import {
  ISpec,
  sleep,
} from "./types";

const currTab = ".meat-tab[data-visible=true] ";

export default function loginFlow (spec: ISpec) {
  spec("navigation flow", async (t) => {
    const {client} = t.app;

    await client.waitForExist("#user-menu", 5000);

    t.comment("navigating to dashboard");
    await client.click("section[data-path=dashboard]");

    await client.waitForExist(".meat-tab[data-id=dashboard] .layout-picker");
    await client.click(currTab + ".layout-picker[data-layout='grid']");

    await sleep(400);

    t.comment("clearing filters if any");
    const clearFiltersSelector = currTab + ".indicator-clear-filters";
    if (await client.isExisting(clearFiltersSelector)) {
      await client.click(clearFiltersSelector);
    }

    t.comment("checking grid is shown");
    await client.waitForExist(currTab + ".grid-item", 5000);

    t.comment("switching to table layout");
    await client.click(currTab + ".layout-picker[data-layout='table']");

    t.comment("checking table is shown");
    await client.waitForExist(currTab + ".table-item", 5000);

    const firstTitleSelector = currTab + ".table-item:first-child .game-table-title";

    t.comment("sorting by name, A-Z");
    await client.click(currTab + "[role='columnheader'][aria-label='table.column.name']");
    t.comment("ensuring the A-Z sorting is correct");
    await client.waitUntilTextExists(firstTitleSelector, "111 first");

    t.comment("sorting by name, Z-A");
    await client.click(currTab + "[role='columnheader'][aria-label='table.column.name']");
    t.comment("ensuring the Z-A sorting is correct");
    await client.waitUntilTextExists(firstTitleSelector, "zzz last");

    await sleep(5000);
  });
}
