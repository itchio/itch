import urls from "common/constants/urls";

// TODO: show recommended for you?
const newTabItems = [
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
    url: urls.itchio + "/featured-games-feed?filter=devlogs",
  },
];
export default newTabItems;
