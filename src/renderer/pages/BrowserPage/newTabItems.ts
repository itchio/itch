import urls from "common/constants/urls";

export const newTabPrimaryItems = [
  {
    label: ["sidebar.explore"],
    icon: "earth",
    url: "itch://featured",
  },
  {
    label: ["sidebar.library"],
    icon: "heart-filled",
    url: "itch://library",
  },
  {
    label: ["sidebar.collections"],
    icon: "video_collection",
    url: "itch://collections",
  },
  {
    label: ["sidebar.dashboard"],
    icon: "archive",
    url: "itch://dashboard",
  },
];

const createItchioUrl = (path: string) =>
  `${urls.itchio}/${path}`.replace(/(?<!:)\/\/+/g, "/");

export const newTabSecondaryItems = [
  {
    label: ["new_tab.random"],
    icon: "shuffle",
    url: createItchioUrl("randomizer"),
  },
  {
    label: ["new_tab.on_sale"],
    icon: "shopping_cart",
    url: createItchioUrl("games/on-sale"),
  },
  {
    label: ["new_tab.top_sellers"],
    icon: "star",
    url: createItchioUrl("games/top-sellers"),
  },
  {
    label: ["new_tab.devlogs"],
    icon: "fire",
    url: createItchioUrl("devlogs"),
  },
];
