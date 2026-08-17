import { actions } from "common/actions";
import { showInExplorerString } from "common/format/show-in-explorer";
import { Dispatch } from "common/types";
import { ambientTab, ambientWind } from "common/util/navigation";
import React, { useEffect, useState } from "react";
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
import { useWatcher } from "renderer/hooks/useWatcher";
import { paths, electron, promisedFs } from "renderer/bridge";

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

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;
  file?: string;
}

const AppLogPage = (props: Props) => {
  const { tab, dispatch, file, sequence } = props;
  const [log, setLog] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    dispatchTabPageUpdate({ tab, dispatch }, { label: ["sidebar.applog"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let stale = false;
    setLoading(true);
    setError(null);
    (async () => {
      let filePath = file;
      if (filePath) {
        console.log(`Reading external log`, filePath);
      } else {
        filePath = paths.mainLogPath();
      }
      const log = await promisedFs.readFile(filePath, { encoding: "utf8" });
      if (stale) return;
      setLog(log);
      setError(null);
    })()
      .catch((e) => {
        if (!stale) setError(e);
      })
      .then(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, [sequence, file]);

  useWatcher((watcher) => {
    watcher.on(actions.openLogFileRequest, async (store) => {
      try {
        const { showOpenDialog } = electron;
        const filePaths = await showOpenDialog({ title: "Open log file" });
        if (filePaths && filePaths.length > 0) {
          const filePath = filePaths[0];
          console.log(`Opening external log`, filePath);
          // read through the store: the mount-time url prop would be
          // stale once the tab has evolved
          const url = ambientTab(store.getState(), { tab }).location?.url;
          if (!url) {
            // tab hasn't derived a location yet, nothing to evolve
            return;
          }
          dispatchTabEvolve(
            { tab, dispatch },
            {
              replace: true,
              url: urlWithParams(url, { file: filePath }),
            }
          );
        }
      } catch (e) {
        console.error(e);
      }
    });
  });

  const onContextMenu = (ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
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

  const onOpenAppLog = () => {
    dispatch(actions.openAppLog({}));
  };

  const onReload = () => {
    dispatchTabReloaded({ tab, dispatch });
  };

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
                  onContextMenu={onContextMenu}
                  onClick={onOpenAppLog}
                  label={T(showInExplorerString())}
                />
                <Spacer />
                {loading ? (
                  <LoadingCircle progress={-1} />
                ) : (
                  <IconButton icon="repeat" onClick={onReload} />
                )}
              </ControlsDiv>
            }
          />
        ) : null}
      </AppLogContentDiv>
    </AppLogDiv>
  );
};

export default withTab(
  hookWithProps(AppLogPage)((map) => ({
    file: map((rs, props) => ambientTab(rs, props).location?.query.file),
  }))(AppLogPage)
);
