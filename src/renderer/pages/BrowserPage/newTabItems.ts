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

export const newTabSecondaryItems = [
  {
    label: ["new_tab.twitter"],
    icon: "twitter",
    url: "https://twitter.com/search?q=itch.io&src=typd",
  },
  {
    label: ["new_tab.random"],
    icon: "shuffle",
    url: urls.itchio + "/randomizer",
  },
  {
    label: ["new_tab.on_sale"],
    icon: "shopping_cart",
    url: urls.itchio + "/games/on-sale",
  },
  {
    label: ["new_tab.top_sellers"],
    icon: "star",
    url: urls.itchio + "/games/top-sellers",
  },
  {
    label: ["new_tab.devlogs"],
    icon: "fire",
    url: urls.itchio + "/devlogs",
  },
];
