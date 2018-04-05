import React from "react";
import { IMeatProps } from "./types";

import Library from "../library";
import Collections from "../collections";
import Dashboard from "../dashboard";

import Preferences from "../preferences";
import Downloads from "../downloads";
import Collection from "../collection";
import Browser from "../url-meat";
import Location from "../location";
import AppLog from "../app-log";
import { Space } from "../../helpers/space";

const showHistory = process.env.ITCH_SHOW_HISTORY === "1";

import styled from "../styles";

const HistoryDiv = styled.div`
  position: absolute;
  pointer-events: none;
  z-index: 1000;
  top: 20px;
  right: 20px;
  background: rgba(128, 40, 40, 0.9);
  color: white;
  padding: 10px;
  border-radius: 4px;
  line-height: 1.4;
  min-width: 400px;

  ul {
    margin-top: 1em;
  }

  .resource {
    color: rgb(130, 130, 220);
    font-weight: bold;
  }
`;

class Meat extends React.PureComponent<IProps> {
  render() {
    const inst = this.props.tabInstance;
    const sp = Space.fromInstance(inst);
    const ConcreteMeat = this.getConcrete(sp);

    if (ConcreteMeat) {
      return (
        <>
          {showHistory ? (
            <HistoryDiv>
              <h2>History</h2>
              <ul>
                {inst.history.map((el, i) => {
                  return (
                    <li
                      key={i}
                      style={{
                        color: i === inst.currentIndex ? "white" : "#aaa",
                      }}
                    >
                      {i} {el.url}{" "}
                      {el.resource ? (
                        <span className="resource">{el.resource}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </HistoryDiv>
          ) : null}
          <ConcreteMeat {...this.props} />
        </>
      );
    } else {
      return <div>Invalid url: {JSON.stringify(sp.url())}</div>;
    }
  }

  getConcrete(sp: Space): React.ComponentClass<IMeatProps> {
    if (sp.isBrowser()) {
      return Browser;
    }

    switch (sp.internalPage()) {
      case "library":
        return Library;
      case "collections":
        if (sp.firstPathElement()) {
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
      case "locations":
        return Location;
      case "applog":
        return AppLog;
      default:
        return null;
    }
  }
}

export default Meat;

interface IProps extends IMeatProps {}
