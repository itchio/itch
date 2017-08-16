import * as React from "react";
import { connect } from "./connect";

import { map } from "underscore";

import urls from "../constants/urls";
import * as actions from "../actions";

import Filler from "./basics/filler";
import Icon from "./basics/icon";
import Button from "./basics/button";
import TitleBar from "./title-bar";
import { IMeatProps } from "./meats/types";

import { transformUrl } from "../util/navigation";

import { dispatcher } from "../constants/action-types";

import styled, * as styles from "./styles";

import { injectIntl, InjectedIntl } from "react-intl";
import format, { formatString } from "./format";

const NewTabContainer = styled.div`${styles.meat()};`;

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

const Spacer = styled.div`height: 120px;`;

const NewTabItem = styled.div`
  ${styles.clickable()} width: auto;
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

const Title = styled.h2`
  flex-basis: 100%;
  text-align: center;
  padding: 20px 0;
  font-size: ${props => props.theme.fontSizes.huge};
`;

const WebNavContainer = styled.div`
  flex-basis: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
`;

const UrlContainer = styled.div`
  position: relative;
  flex-grow: 10;

  .browser-address {
    ${styles.heavyInput()};
    width: 100%;
    text-indent: 32px;
  }

  .icon-earth {
    position: absolute;
    left: 19px;
    bottom: 50%;
    transform: translateY(55%);
    font-size: 19px;
    color: ${props => props.theme.inputPlaceholder};
  }
`;

export class NewTab extends React.PureComponent<IProps & IDerivedProps> {
  urlField: HTMLInputElement;

  constructor() {
    super();
  }

  render() {
    const { intl, tab, evolveTab } = this.props;

    return (
      <NewTabContainer>
        <NewTabGrid>
          <TitleBar tab={tab} />

          <Spacer />

          <Title>
            {format(["new_tab.titles.buttons"])}
          </Title>

          {map(newTabItems, item => {
            const { label, icon, path } = item;

            return (
              <NewTabItem
                key={path}
                onClick={() => evolveTab({ tab: tab, path })}
              >
                <Icon icon={icon} />
                <span>
                  {format(label)}
                </span>
              </NewTabItem>
            );
          })}

          <Title>
            {format(["new_tab.titles.input"])}
          </Title>
          <WebNavContainer>
            <UrlContainer>
              <input
                className="browser-address"
                autoFocus
                onKeyUp={this.addressKeyUp}
                ref={this.onUrlField}
                placeholder={formatString(intl, [
                  "new_tab.titles.browser_placeholder",
                ])}
              />
              <span className="icon icon-earth" />
            </UrlContainer>
            <Filler />
            <Button
              primary
              className="go-button"
              discreet
              icon="arrow-right"
              label={format(["grid.item.open"])}
              onClick={this.navigate}
            />
          </WebNavContainer>
        </NewTabGrid>
      </NewTabContainer>
    );
  }

  onUrlField = (urlField: HTMLInputElement) => {
    this.urlField = urlField;
  };

  addressKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      let input = e.currentTarget.value;
      if (input.length < 1) {
        return;
      }
      await this.navigate();
    }
  };

  navigate = async () => {
    const { urlField } = this;
    if (!urlField) {
      return;
    }

    const url = await transformUrl(urlField.value);
    const { tab, evolveTab } = this.props;
    evolveTab({ tab: tab, path: `url/${url}` });
  };
}

interface IProps extends IMeatProps {}

interface IDerivedProps {
  evolveTab: typeof actions.evolveTab;

  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(NewTab), {
  dispatch: dispatch => ({
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
