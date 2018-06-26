import { actions } from "common/actions";
import { showInExplorerString } from "common/format/show-in-explorer";
import { Space } from "common/helpers/space";
import { Dispatch } from "common/types";
import React from "react";
import ErrorState from "renderer/basics/ErrorState";
import IconButton from "renderer/basics/IconButton";
import Link from "renderer/basics/Link";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { hook } from "renderer/hocs/hook";
import { withSpace } from "renderer/hocs/withSpace";
import Log from "renderer/pages/AppLogPage/Log";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";

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

class AppLogPage extends React.PureComponent<Props, State> {
  constructor(props: AppLogPage["props"], context: any) {
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
          <ErrorState error={error} />
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

  componentDidUpdate(prevProps: AppLogPage["props"]) {
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
    const { dispatch } = this.props;
    dispatch(actions.openAppLog({}));
  };

  onReload = () => {
    const { dispatch, space } = this.props;
    dispatch(space.makeReload());
  };
}

interface Props extends MeatProps {
  space: Space;
  dispatch: Dispatch;
}

interface State {
  loading: boolean;
  error: Error;
  log: string;
}

export default withSpace(hook()(AppLogPage));
