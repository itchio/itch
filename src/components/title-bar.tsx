
import * as React from "react";
import {createStructuredSelector} from "reselect";
import {connect, I18nProps} from "./connect";

import staticTabData from "../constants/static-tab-data";
import {IAppState, ITabData} from "../types";

import {dispatcher} from "../constants/action-types";
import * as actions from "../actions";

import {FiltersContainer} from "./game-filters";
import IconButton from "./basics/icon-button";

import styled, * as styles from "./styles";

const DraggableDiv = styled.div`
  -webkit-app-region: drag;
  flex: 1 1;
  display: flex;
  align-self: stretch;
`;

const DraggableDivInner = styled.div`
  flex: 1 1;
  display: flex;
  align-self: center;
`;

const Filler = styled.div`
  flex: 1 1;
`;

const TitleDiv = styled.div`
  ${styles.singleLine()};

  font-size: ${props => props.theme.fontSizes.large};
`;

const emptyObj = {};

export class TitleBar extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, tab, tabData} = this.props;

    const staticData: ITabData = staticTabData[tab] || emptyObj;
    const label = tabData.webTitle || tabData.label || staticData.label || "";

    return <FiltersContainer>
        <DraggableDiv>
          <DraggableDivInner>
            <TitleDiv>{t.format(label)}</TitleDiv>
            <Filler/>
          </DraggableDivInner>
        </DraggableDiv>
        <IconButton icon="cross" onClick={this.closeClick}/>
      </FiltersContainer>;
  }

  closeClick = () => {
    this.props.hideWindow({});
  }
}

interface IProps {
  tab: string;
}

interface IDerivedProps {
  tabData: ITabData;

  hideWindow: typeof actions.hideWindow;
}

export default connect<IProps>(TitleBar, {
  state: () => createStructuredSelector({
    tabData: (state: IAppState, props: IProps) => state.session.tabData[props.tab] || emptyObj,
  }),
  dispatch: (dispatch) => ({
    hideWindow: dispatcher(dispatch, actions.hideWindow),
  }),
});
