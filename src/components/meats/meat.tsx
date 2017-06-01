
import * as React from "react";
import {IBaseMeatProps, IMeatProps} from "./types";

import staticTabData from "../../constants/static-tab-data";

import {pathPrefix} from "../../util/navigation";

import Library from "../library";
import Collections from "../collections";
import Dashboard from "../dashboard";

import Preferences from "../preferences";
import Downloads from "../downloads";
import Collection from "../collection";
import Browser from "../url-meat";
import NewTab from "../new-tab";
import Location from "../location";

export default class Meat extends React.PureComponent<IProps, void> {
  render() {
    const ConcreteMeat = this.getConcrete();    

    const {tab, tabData = {}} = this.props;
    const tabPath = staticTabData[tab] ? tab : tabData.path;

    if (ConcreteMeat) {
      return <ConcreteMeat {...this.props} tabPath={tabPath}/>;
    } else {
      return <div>?</div>;
    }
  }

  getConcrete(): React.ComponentClass<IMeatProps>  {
    const {tab, tabData} = this.props;

    switch (tab) {
      case "featured":
        return Browser;
      case "library":
        return Library;
      case "collections":
        return Collections;
      case "dashboard":
        return Dashboard;
      case "downloads":
        return Downloads;
      case "preferences":
        return Preferences;
      default:
        if (tabData && tabData.path) {
          const {path} = tabData;
          const prefix = pathPrefix(path);
          switch (prefix) {
            case "new":
              return NewTab;
            case "locations":
              return Location;
            case "collections":
              return Collection;
            case "toast":
              return Collection;
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
  }
}

interface IProps extends IBaseMeatProps {}
