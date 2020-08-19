import { actions } from "common/actions";
import { showInExplorerString } from "common/format/show-in-explorer";
import { Dispatch } from "common/types";
import { ambientTab, ambientWind } from "common/util/navigation";
import React from "react";
import ErrorState from "renderer/basics/ErrorState";
import IconButton from "renderer/basics/IconButton";
import Link from "renderer/basics/Link";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { hookWithProps } from "renderer/hocs/hook";
import {
  dispatchTabPageUpdate,
  dispatchTabReloaded,
  dispatchTabEvolve,
  urlWithParams,
} from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import Log from "renderer/pages/AppLogPage/Log";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import watching, { Watcher } from "renderer/hocs/watching";

const AppLogDiv = styled.div`
  ${styles.meat};
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

@watching
class AppLogPage extends React.PureComponent<Props, State> {
  constructor(props: AppLogPage["props"], context: any) {
    super(props, context);
    this.state = {
      log: null,
      loading: true,
      error: null,
    };
  }

  subscribe(watcher: Watcher) {
    watcher.on(actions.openLogFileRequest, async () => {
      try {
        const electron = require("electron").remote;
        const { dialog, BrowserWindow } = electron;
        const { filePaths } = await dialog.showOpenDialog(
          BrowserWindow.getFocusedWindow(),
          {
            title: "Open log file",
          }
        );
        if (filePaths && filePaths.length > 0) {
          const filePath = filePaths[0];
          console.log(`Opening external log`, filePath);
          const { url } = this.props;
          dispatchTabEvolve(this.props, {
            replace: true,
            url: urlWithParams(url, { file: filePath }),
          });
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  render() {
    const { loading, log, error } = this.state;

    return (
      <AppLogDiv>
        <AppLogContentDiv>
          <ErrorState error={error} />
          {log ? (
            <Log
              log={log || ""}
              extraControls={
                <ControlsDiv>
                  <Spacer />
                  <Link
                    onContextMenu={this.onContextMenu}
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

  onContextMenu = (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    const { dispatch } = this.props;
    const { clientX, clientY } = ev;
    dispatch(
      actions.popupContextMenu({
        clientX,
        clientY,
        template: [
          {
            localizedLabel: "Open file...",
            action: actions.openLogFileRequest({}),
          },
        ],
        wind: ambientWind(),
      })
    );
  };

  componentDidMount() {
    dispatchTabPageUpdate(this.props, { label: ["sidebar.applog"] });
    this.queueFetch();
  }

  componentDidUpdate(prevProps: AppLogPage["props"]) {
    if (
      prevProps.sequence != this.props.sequence ||
      prevProps.file !== this.props.file
    ) {
      this.queueFetch();
    }
  }

  queueFetch = () => {
    this.setState({ loading: true, error: null });
    this.doFetch()
      .catch((e) => {
        this.setState({ error: e });
      })
      .then(() => {
        this.setState({ loading: false });
      });
  };

  doFetch = async () => {
    const promisedFs = (await import("fs")).promises;

    let filePath = this.props.file;
    if (filePath) {
      console.log(`Reading external log`, filePath);
    } else {
      const { mainLogPath } = await import("common/util/paths");
      filePath = mainLogPath();
    }
    const log = await promisedFs.readFile(filePath, { encoding: "utf8" });
    this.setState({ log, error: null });
  };

  onOpenAppLog = () => {
    const { dispatch } = this.props;
    dispatch(actions.openAppLog({}));
  };

  onReload = () => {
    dispatchTabReloaded(this.props);
  };
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;
  url: string;
  file?: string;
}

interface State {
  loading: boolean;
  error: Error;
  log: string;
}

export default withTab(
  hookWithProps(AppLogPage)((map) => ({
    url: map((rs, props) => ambientTab(rs, props).location.url),
    file: map((rs, props) => ambientTab(rs, props).location.query.file),
  }))(AppLogPage)
);
