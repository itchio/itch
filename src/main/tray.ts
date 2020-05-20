import { MainState } from "main";
import { Tray, app, Menu } from "electron";
import { join } from "path";
import { mainLogger } from "main/logger";
import { broadcastPacket } from "main/websocket-handler";
import { packets } from "common/packets";
import _ from "lodash";
import { launchGame } from "main/queries-launch";
import { showModal } from "main/show-modal";
import { modals } from "common/modals";
import { formatMessage } from "main/format-message";

const logger = mainLogger.childWithName("tray");

import kitchTrayImage from "static/images/tray/kitch.png";
import itchTrayImage from "static/images/tray/itch.png";
import { Client, messages } from "@itchio/valet";

function trayIcon(): string {
  console.log(`kitchTrayImage = ${JSON.stringify(kitchTrayImage, null, 2)}`);
  return join(__dirname, app.name === "kitch" ? kitchTrayImage : itchTrayImage);
}

export function toggleVisibility(ms: MainState) {
  let win = ms.browserWindow;
  if (!win) {
    return;
  }
  if (win.isVisible()) {
    logger.info(`Hiding main window`);
    win.hide();
  } else {
    logger.info(`Showing main window`);
    win.show();
  }
}

export function initTray(ms: MainState) {
  let tray = new Tray(trayIcon());
  tray.on("click", (ev) => {
    logger.info(`Tray clicked`);
    ev.preventDefault();
    toggleVisibility(ms);
  });
  tray.on("right-click", (ev) => {
    logger.info(`Tray right-clicked`);
    tray.popUpContextMenu();
  });
  ms.tray = tray;
  triggerTrayMenuUpdate(ms);
}

export function triggerTrayMenuUpdate(ms: MainState) {
  updateTrayMenu(ms).catch((e) => {
    logger.warn(`While updating tray menu: ${e.stack}`);
  });
}

async function updateTrayMenu(ms: MainState) {
  if (!ms.tray) {
    return;
  }

  let template: Electron.MenuItemConstructorOptions[] = [
    {
      label: formatMessage(ms, { id: "menu.file.preferences" }),
      click: () =>
        showModal(ms, modals.preferences, {}).catch((e) =>
          console.warn(`while showing preferences: ${e.stack}`)
        ),
    },
    { type: "separator" },
    {
      label: formatMessage(ms, { id: "menu.file.quit" }),
      click: () => ms.browserWindow?.close(),
    },
  ];

  template = [
    {
      label: formatMessage(ms, { id: "sidebar.explore" }),
      click: () => {
        ms.browserWindow?.show();
        broadcastPacket(ms, packets.navigate, {
          url: "https://itch.io",
        });
      },
    },
    {
      label: formatMessage(ms, { id: "sidebar.library" }),
      click: () => {
        ms.browserWindow?.show();
        broadcastPacket(ms, packets.navigate, {
          url: "itch://library",
        });
      },
    },
    {
      type: "separator",
    },
    ...template,
  ];

  const client = new Client();
  let { items } = await client.call(messages.FetchCaves, {
    sortBy: "lastTouched",
    limit: 10,
  });

  if (items) {
    items = _.uniqBy(items, (cave) => cave.game?.id);
    template = [
      ...items.map((cave) => ({
        label: cave.game.title,
        click: () => {
          launchGame(ms, {
            gameId: cave.game.id,
            caveId: cave.id,
          }).catch((e) => logger.warn(`While launching game: ${e.stack}`));
        },
      })),
      {
        type: "separator",
      },
      ...template,
    ];
  }

  ms.tray.setContextMenu(Menu.buildFromTemplate(template));
}
