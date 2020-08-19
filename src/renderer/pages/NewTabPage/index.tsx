import { Dispatch } from "common/types";
import React from "react";
import Icon from "renderer/basics/Icon";
import { hook } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import BrowserBar from "renderer/pages/BrowserPage/BrowserBar";
import {
  newTabPrimaryItems,
  newTabSecondaryItems,
} from "renderer/pages/BrowserPage/newTabItems";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { map } from "underscore";

const NewTabPageDiv = styled.div`
  ${styles.meat};
`;

const NewTabMain = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  overflow-y: auto;
`;

const NewTabGrid = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: flex-start;
  align-content: flex-start;
  flex: 1;
  flex-shrink: 0;

  max-width: 960px;
  margin-top: 40px;
`;

const NewTabItem = styled.a`
  ${styles.clickable};

  color: ${(props) => props.theme.baseText};
  text-decoration: none;

  width: auto;
  flex-grow: 1;
  padding: 20px 10px;
  margin: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;

  min-width: 160px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;

  .icon {
    font-size: 70px;
    margin-bottom: 25px;
  }
`;

const Title = styled.h2`
  flex-basis: 100%;
  text-align: center;
  padding: 20px 0;
  font-size: ${(props) => props.theme.fontSizes.huge};
`;

class NewTabPage extends React.PureComponent<Props> {
  render() {
    return (
      <NewTabPageDiv>
        <BrowserBar />
        <NewTabMain>
          <NewTabGrid>
            {map(newTabPrimaryItems, (item) => {
              const { label, icon, url } = item;

              return (
                <NewTabItem key={url} href={url}>
                  <Icon icon={icon} />
                  <span>{T(label)}</span>
                </NewTabItem>
              );
            })}
          </NewTabGrid>

          <NewTabGrid>
            <Title>{T(["new_tab.titles.buttons"])}</Title>
            {map(newTabSecondaryItems, (item) => {
              const { label, icon, url } = item;

              return (
                <NewTabItem key={url} href={url}>
                  <Icon icon={icon} />
                  <span>{T(label)}</span>
                </NewTabItem>
              );
            })}
          </NewTabGrid>
        </NewTabMain>
      </NewTabPageDiv>
    );
  }

  componentDidMount() {
    dispatchTabPageUpdate(this.props, {
      label: ["sidebar.new_tab"],
    });
  }
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;
}

export default withTab(hook()(NewTabPage));
