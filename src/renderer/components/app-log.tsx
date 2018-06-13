import { MeatProps } from "renderer/components/meats/types";
import React from "react";

import styled, * as styles from "./styles";
import Log from "./basics/log";
import Link from "./basics/link";
import IconButton from "./basics/icon-button";
import { T } from "renderer/t";
import { showInExplorerString } from "common/format/show-in-explorer";
import { Space } from "common/helpers/space";
import { rendererWindow } from "common/util/navigation";
import { withTab } from "./meats/tab-provider";
import { ITabInstance } from "common/types";
import { withDispatch, Dispatch } from "./dispatch-provider";
import { withTabInstance } from "./meats/tab-instance-provider";
import { actions } from "common/actions";

const AppLogDiv = styled.div`
  ${styles.meat()};
`;

const Spacer = styled.div`
  display: inline-block;
  height: 1px;
  width: 8px;
`;

const AppLogContentDiv = styled.div`
  overflow-y: hidden;
  padding: 1em;
  padding-bottom: 50px;
  height: 100%;
`;

const ControlsDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

class AppLog extends React.PureComponent<Props> {
  render() {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);

    let log = sp.log().log || "Loading...\n";

    return (
      <AppLogDiv>
        <AppLogContentDiv>
          <Log
            log={log}
            extraControls={
              <ControlsDiv>
                <Spacer />
                <Link
                  onClick={this.onOpenAppLog}
                  label={T(showInExplorerString())}
                />
                <Spacer />
                <IconButton icon="repeat" onClick={this.onReload} />
              </ControlsDiv>
            }
          />
        </AppLogContentDiv>
      </AppLogDiv>
    );
  }

  onOpenAppLog = () => {
    this.props.dispatch(actions.openAppLog({}));
  };

  onReload = () => {
    this.props.dispatch(
      actions.tabReloaded({ window: rendererWindow(), tab: this.props.tab })
    );
  };
}

interface Props extends MeatProps {
  tab: string;
  tabInstance: ITabInstance;
  dispatch: Dispatch;
}

export default withTab(withTabInstance(withDispatch(AppLog)));
