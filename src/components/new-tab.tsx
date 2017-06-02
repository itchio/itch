
import * as React from "react";
import {connect, I18nProps} from "./connect";

import {map} from "underscore";

import urls from "../constants/urls";
import * as actions from "../actions";

import Icon from "./basics/icon";
import TitleBar from "./title-bar";
import {IMeatProps} from "./meats/types";

import {transformUrl} from "../util/navigation";

import {dispatcher} from "../constants/action-types";

import styled, * as styles from "./styles";

const NewTabContainer = styled.div`
  ${styles.meat()}
`;

const NewTabGrid = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: flex-start;
  align-content: flex-start;
  overflow-x: hidden;
  overflow-y: auto;
  flex: 1;
`;

const NewTabItem = styled.div`
  ${styles.clickable()}

  width: auto;
  flex-grow: 1;
  padding: 30px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .icon {
    font-size: 70px;
    margin-bottom: 25px;
  }
`;

const ItchLogo = styled.div`
  width: 100%;
  height: 130px;
  margin: 40px 0;
  background-image: url("./static/images/logos/app-white.svg");
  background-position: 50% 50%;
  background-size: auto 70%;
  background-repeat: no-repeat;
  opacity: .2;
`;

  const Title = styled.h2`
  flex-basis: 100%;
  text-align: center;
  padding: 20px 0;
  font-size: ${props => props.theme.fontSizes.huge};
`;

export class NewTab extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  constructor () {
    super();
  }

  render () {
    const {t, tab, evolveTab} = this.props;

    return <NewTabContainer>
      <NewTabGrid>
        <TitleBar tab={tab}/>
        <ItchLogo/>

        <Title>{t("new_tab.titles.buttons")}</Title>

        {map(newTabItems, (item) => {
          const {label, icon, path} = item;

          return <NewTabItem key={path} onClick={() => evolveTab({id: tab, path})}>
            <Icon icon={icon}/>
            <span>{t.format(label)}</span>
          </NewTabItem>;
        })}

        <Title>{t("new_tab.titles.input")}</Title>
        <div className="browser-address-container">
          <input className="browser-address" autoFocus onKeyUp={this.addressKeyUp}
            placeholder={t("new_tab.titles.browser_placeholder")}/>
          <span className="icon icon-earth"/>
        </div>
      </NewTabGrid>
    </NewTabContainer>;
  }

  addressKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      let input = e.currentTarget.value;
      if (input.length < 1) {
        return;
      }

      const url = await transformUrl(input);
      const {tab, evolveTab} = this.props;
      evolveTab({id: tab, path: `url/${url}`});
    }
  }
}

interface IProps extends IMeatProps {}

interface IDerivedProps {
  evolveTab: typeof actions.evolveTab;
}

export default connect<IProps>(NewTab, {
  dispatch: (dispatch) => ({
    evolveTab: dispatcher(dispatch, actions.evolveTab),
  }),
});

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
    label: ["new_tab.devlogs"],
    icon: "fire",
    path: "url/" + urls.itchio + "/featured-games-feed?filter=devlogs",
  },
];
