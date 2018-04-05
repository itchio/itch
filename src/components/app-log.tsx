import { IMeatProps } from "./meats/types";
import React from "react";

import styled, * as styles from "./styles";
import Log from "./basics/log";
import Link from "./basics/link";
import IconButton from "./basics/icon-button";
import { connect, Dispatchers, actionCreatorsList } from "./connect";
import format from "./format";
import { showInExplorerString } from "../format/show-in-explorer";
import { Space } from "../helpers/space";

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

class AppLog extends React.PureComponent<IProps & IDerivedProps> {
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
                  label={format(showInExplorerString())}
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
    this.props.openAppLog({});
  };

  onReload = () => {
    this.props.tabReloaded({ tab: this.props.tab });
  };
}

interface IProps extends IMeatProps {}

const actionCreators = actionCreatorsList("openAppLog", "tabReloaded");

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(AppLog, { actionCreators });
