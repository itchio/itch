
import * as React from "react";
import {connect} from "./connect";
import {map} from "underscore";

import urls from "../constants/urls";
import * as actions from "../actions";

import Icon from "./icon";

import {transformUrl} from "../util/navigation";
import os from "../util/os";
const osx = os.itchPlatform() === "osx";

import {IState, IDispatch} from "../types";
import {ILocalizer} from "../localizer";
import {dispatcher} from "../constants/action-types";

// TODO: show recommended for you?
const newTabItems = [
  {
    label: ["new_tab.twitter"],
    icon: "twitter",
    path: "url/https://twitter.com/search?q=itch.io&src=typd",
  },
  {
    label: ["new_tab.random"],
    icon: "shuffle",
    path: "url/" + urls.itchio + "/randomizer",
  },
  {
    label: ["new_tab.on_sale"],
    icon: "shopping_cart",
    path: "url/" + urls.itchio + "/games/on-sale",
  },
  {
    label: ["new_tab.top_sellers"],
    icon: "star",
    path: "url/" + urls.itchio + "/games/top-sellers",
  },
  {
    label: ["new_tab.community"],
    icon: "fire",
    path: "url/" + urls.itchio + "/community",
  },
];

export class NewTab extends React.Component<INewTabProps> {
  constructor () {
    super();

    this.addressKeyUp = this.addressKeyUp.bind(this);
  }

  render () {
    const {t, tabId, evolveTab} = this.props;

    return <div className="new-tab-meat">
      <div className="hub-grid">
        <div className="itch-logo"/>

        <h2>{t("new_tab.titles.buttons")}</h2>

        {map(newTabItems, (item) => {
          const {label, icon, path} = item;

          return <div key={path} className="hub-item new-tab-item" onClick={() => evolveTab({id: tabId, path})}>
            <Icon icon={icon}/>
            <span>{t.format(label)}</span>
          </div>;
        })}

        <h2>{t("new_tab.titles.input")}</h2>
        <div className="browser-address-container">
          <input className="browser-address" autoFocus onKeyUp={this.addressKeyUp}
            placeholder={t("new_tab.titles.browser_placeholder")}/>
          <span className="icon icon-earth"/>
          <div className="kb-shortcut">
          {osx
            ? <Icon icon="command"/>
            : <Icon icon="ctrl"/>
          }
          +L
          </div>
        </div>
      </div>
    </div>;
  }

  async addressKeyUp (e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      let input = e.currentTarget.value;
      if (input.length < 1) {
        return;
      }

      const url = await transformUrl(input);
      const {tabId, evolveTab} = this.props;
      evolveTab({id: tabId, path: `url/${url}`});
    }
  }
}

interface INewTabProps {
  t: ILocalizer;
  tabId: string;

  evolveTab: typeof actions.evolveTab;
}

const mapStateToProps = (state: IState) => ({});

const mapDispatchToProps = (dispatch: IDispatch) => ({
  evolveTab: dispatcher(dispatch, actions.evolveTab),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(NewTab);
