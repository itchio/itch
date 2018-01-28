import * as React from "react";
import { IBaseMeatProps, IMeatProps } from "./types";

import staticTabData from "../../constants/static-tab-data";

import Library from "../library";
import Collections from "../collections";
import Dashboard from "../dashboard";

import Preferences from "../preferences";
import Downloads from "../downloads";
import Collection from "../collection";
import Browser from "../url-meat";
import NewTab from "../new-tab";
import Location from "../location";
import AppLog from "../app-log";
import { Space } from "../../helpers/space";

export default class Meat extends React.PureComponent<IProps> {
  render() {
    const ConcreteMeat = this.getConcrete();

    const { tab, tabData = {} } = this.props;
    const tabPath = staticTabData[tab] ? tab : tabData.path;

    if (ConcreteMeat) {
      return <ConcreteMeat {...this.props} tabPath={tabPath} />;
    } else {
      return <div>?</div>;
    }
  }

  getConcrete(): React.ComponentClass<IMeatProps> {
    const { tabData } = this.props;

    const sp = Space.fromData(tabData);
    switch (sp.prefix) {
      case "featured":
        return Browser;
      case "library":
        return Library;
      case "collections":
        if (sp.suffix) {
          return Collection;
        } else {
          return Collections;
        }
      case "dashboard":
        return Dashboard;
      case "downloads":
        return Downloads;
      case "preferences":
        return Preferences;
      case "new":
        return NewTab;
      case "locations":
        return Location;
      case "collections":
        return Collection;
      case "toast":
        return Collection;
      case "applog":
        return AppLog;
      case "url":
      case "games":
      case "users":
      case "search":
        return Browser;
      default:
        return null;
    }
  }
}

interface IProps extends IBaseMeatProps {}
