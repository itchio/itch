
import * as React from "react";
import * as PropTypes from "prop-types";

import {IStore, IMarket} from "../types";

import * as actions from "../actions";
import watching, {Watcher} from "./watching";

import pathmaker from "../util/pathmaker";
import Market from "../util/market";

let cache = window as any as {
  __itch_user_market: Market;
  __itch_global_market: Market;
};

@watching
export default class MarketProvider extends React.Component<void, IState> {
  static contextTypes = {
    store: PropTypes.object,
  };

  static childContextTypes = {
    market: PropTypes.object,
    globalMarket: PropTypes.object,
  };

  constructor() {
    super();
    this.state = {
      market: null,
      globalMarket: null,
    };
  }

  subscribe (watcher: Watcher) {
    watcher.on(actions.loginSucceeded, async (store, action) => {
      await this.getMarkets(store);
    });
    watcher.on(actions.logout, async (store, action) => {
      await this.getMarkets(store);
    });
  };

  componentDidMount() {
    console.log(`market provider mounted, store = `, this.context.store);
    this.getMarkets(this.context.store).catch((e) => {
      console.error(`Could not get markets:\n ${e.stack}`);
    });
  }

  async getMarkets(store: IStore) {
    console.log(`market provider getting markets...`);

    let market = await this.getUserMarket(store);
    let globalMarket = await this.getGlobalMarket(store);

    this.setState({
      market,
      globalMarket,
    });

    console.log(`market provider got markets: `, market, globalMarket);
    this.setState({market, globalMarket});
  }

  async getUserMarket(store: IStore) {
    const state = store.getState();

    // we only want a user market if we're loaded
    if (!state ||
        !state.session ||
        !state.session.credentials ||
        !state.session.credentials.me) {
      console.log(`user market: not connected yet, will try again later`);
      cache.__itch_user_market = null;
      return null;
    }

    // maybe we reloaded, there might be a market stored in itch global
    let market = cache.__itch_user_market;
    if (market) {
      console.log(`user market: using cached market`);
      return market;
    }

    console.log(`user market: connecting...`);
    const meId = state.session.credentials.me.id;
    market = new Market();
    try {
      await market.load(pathmaker.userDbPath(meId));
      console.log(`user market: connected!`);
    } catch (e) {
      console.error(`user market: couldn't connect:\n${e.stack}`);
      market = null;
    }
    cache.__itch_user_market = market;
    return market;
  }

  async getGlobalMarket(store: IStore) {
    let market = cache.__itch_global_market;

    if (market) {
      console.log(`global market: using cached market`);
      return market;
    }

    console.log(`global market: connecting...`);
    market = new Market();
    try {
      await market.load(pathmaker.globalDbPath());
      console.log(`global market: connected!`);
    } catch (e) {
      console.error(`global market: couldn't connect:\n${e.stack}`)
      market = null;
    }
    cache.__itch_global_market = market;
    return market;
  }

  render() {
    console.log(`market provider rendering, markets = : `, this.state.market, this.state.globalMarket);
    return React.Children.only(this.props.children);
  }

  getChildContext() {
    console.log(`market provider asked to give child context = `, this.state);
    return this.state;
  }
}

interface IState {
  market: IMarket;
  globalMarket: IMarket;
}
