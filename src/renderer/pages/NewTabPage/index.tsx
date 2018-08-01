import { actions } from "common/actions";
import { Space } from "common/helpers/space";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import React from "react";
import Icon from "renderer/basics/Icon";
import { hook } from "renderer/hocs/hook";
import { withSpace } from "renderer/hocs/withSpace";
import BrowserBar from "renderer/pages/BrowserPage/BrowserBar";
import newTabItems from "renderer/pages/BrowserPage/newTabItems";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { map } from "underscore";

const NewTabPageDiv = styled.div`
  ${styles.meat};
`;

const NewTabMain = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  position: relative;
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

const NewTabItem = styled.a`
  ${styles.clickable};

  color: ${props => props.theme.baseText};
  text-decoration: none;

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

const Title = styled.h2`
  flex-basis: 100%;
  text-align: center;
  padding: 20px 0;
  font-size: ${props => props.theme.fontSizes.huge};
`;

class NewTabPage extends React.PureComponent<Props> {
  render() {
    return (
      <NewTabPageDiv>
        <BrowserBar />
        <NewTabMain>
          <NewTabGrid>
            <Title>{T(["new_tab.titles.buttons"])}</Title>

            {map(newTabItems, item => {
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
    const { dispatch, space } = this.props;
    dispatch(
      space.makeFetch({
        label: ["sidebar.new_tab"],
      })
    );
  }
}

interface Props extends MeatProps {
  dispatch: Dispatch;
  space: Space;
}

export default withSpace(hook()(NewTabPage));
