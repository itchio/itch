import { ComponentType } from "react";
import { LocalizedString } from "common/types";
import urls from "common/constants/urls";
import JamJarIcon from "renderer/basics/icons/JamJarIcon";
import { SvgIconProps } from "renderer/basics/icons/SvgIcon";

export interface NewTabItem {
  label: LocalizedString;
  url: string;
  /** icomoon glyph name, rendered via Icon */
  icon?: string;
  /** standalone SVG icon component, takes precedence over icon */
  iconComponent?: ComponentType<SvgIconProps>;
}

export const newTabPrimaryItems: NewTabItem[] = [
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
  {
    label: ["sidebar.upload"],
    icon: "upload",
    url: "itch://upload",
  },
];

export const newTabSecondaryItems: NewTabItem[] = [
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
  {
    label: ["new_tab.jams"],
    iconComponent: JamJarIcon,
    url: urls.itchio + "/jams",
  },
];
