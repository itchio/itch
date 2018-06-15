import { MeatProps } from "renderer/components/meats/types";
import React from "react";

import styled, * as styles from "./styles";
import Log from "./basics/log";
import Link from "./basics/link";
import IconButton from "./basics/icon-button";
import { T } from "renderer/t";
import { showInExplorerString } from "common/format/show-in-explorer";
import { rendererWindow } from "common/util/navigation";
import { withTab } from "./meats/tab-provider";
import { withDispatch, Dispatch } from "./dispatch-provider";
import { actions } from "common/actions";
import LoadingCircle from "./basics/loading-circle";
import ErrorState from "./butler-call/error-state";

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

class AppLog extends React.PureComponent<Props, State> {
  constructor(props: AppLog["props"], context: any) {
    super(props, context);
    this.state = {
      log: null,
      loading: true,
      error: null,
    };
  }

  render() {
    const { loading, log, error } = this.state;

    return (
      <AppLogDiv>
        <AppLogContentDiv>
          {error ? <ErrorState error={error} /> : null}
          {log ? (
            <Log
              log={log || ""}
              extraControls={
                <ControlsDiv>
                  <Spacer />
                  <Link
                    onClick={this.onOpenAppLog}
                    label={T(showInExplorerString())}
                  />
                  <Spacer />
                  {loading ? (
                    <LoadingCircle progress={-1} />
                  ) : (
                    <IconButton icon="repeat" onClick={this.onReload} />
                  )}
                </ControlsDiv>
              }
            />
          ) : null}
        </AppLogContentDiv>
      </AppLogDiv>
    );
  }

  componentDidMount() {
    this.queueFetch();
  }

  componentDidUpdate(prevProps: AppLog["props"]) {
    if (prevProps.sequence != this.props.sequence) {
      this.queueFetch();
    }
  }

  queueFetch = () => {
    this.setState({ loading: true, error: null });
    this.doFetch()
      .catch(e => {
        this.setState({ error: e });
      })
      .then(() => {
        this.setState({ loading: false });
      });
  };

  doFetch = async () => {
    const fs = await import("fs");
    const { promisify } = await import("common/util/itch-promise");
    const readFile = promisify(fs.readFile);

    const { mainLogPath } = await import("common/util/paths");
    const log = await readFile(mainLogPath(), { encoding: "utf8" });
    this.setState({ log, error: null });
  };

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
  dispatch: Dispatch;
}

interface State {
  loading: boolean;
  error: Error;
  log: string;
}

export default withTab(withDispatch(AppLog));
