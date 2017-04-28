
import * as React from "react";
import {connect, I18nProps} from "./connect";

import {map} from "underscore";

import urls from "../constants/urls";
import * as actions from "../actions";

import Icon from "./basics/icon";

import {transformUrl} from "../util/navigation";

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

export class NewTab extends React.Component<IProps & IDerivedProps & I18nProps, void> {
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

interface IProps {
  tabId: string;
}

interface IDerivedProps {
  evolveTab: typeof actions.evolveTab;
}

export default connect<IProps>(NewTab, {
  dispatch: (dispatch) => ({
    evolveTab: dispatcher(dispatch, actions.evolveTab),
  }),
});
