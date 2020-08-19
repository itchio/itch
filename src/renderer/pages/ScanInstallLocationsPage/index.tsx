import { actions } from "common/actions";
import { hookLogging, messages } from "common/butlerd";
import { Game } from "common/butlerd/messages";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import { legacyMarketPath } from "common/util/paths";
import React from "react";
import Button from "renderer/basics/Button";
import Filler from "renderer/basics/Filler";
import Link from "renderer/basics/Link";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { ModalButtons } from "renderer/basics/modal-styles";
import { rcall } from "renderer/butlerd/rcall";
import { doAsync } from "renderer/helpers/doAsync";
import { hook } from "renderer/hocs/hook";
import { dispatchTabPageUpdate } from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import { rendererLogger } from "renderer/logger";
import Log from "renderer/pages/AppLogPage/Log";
import Page from "renderer/pages/common/Page";
import { FilterSpacer } from "renderer/pages/common/SortsAndFilters";
import StandardGameCover, {
  standardCoverHeight,
  standardCoverWidth,
} from "renderer/pages/common/StandardGameCover";
import StandardGameDesc from "renderer/pages/common/StandardGameDesc";
import { Box, BoxInner } from "renderer/pages/PageStyles/boxes";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";
import { recordingLogger } from "common/logger";

enum Stage {
  Scanning,
  NeedConfirm,
  Done,
}

const coverHeight = 20;
const coverWidth = (coverHeight / standardCoverHeight) * standardCoverWidth;

const StyledLog = styled(Log)`
  tbody {
    min-height: 240px;
  }

  padding-bottom: 1em;
`;

const TinyCover = styled(StandardGameCover)`
  width: ${coverWidth}px;
  height: ${coverHeight}px;
  overflow: hidden;

  margin-right: 8px;
`;

const PageScan = styled(Page)`
  user-select: none;
  height: 100%;
  padding: 20px;
`;

const WideBox = styled(Box)`
  width: 100%;
`;

const ListDiv = styled.div`
  flex-grow: 1000; /* Filler is 100 */
  flex-shrink: 0;
`;

const ListDivSpacer = styled.div`
  flex-shrink: 0;
  height: 24px;
`;

const List = styled.ul`
  overflow-y: auto;
  max-height: 300px;
  min-width: 120px;
  margin-top: 1em;
  flex-grow: 1;

  li {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 6px 0;
  }
`;

const SectionDiv = styled.div`
  padding: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const parentLogger = rendererLogger.child(__filename);

class ScanInstallLocations extends React.PureComponent<Props, State> {
  resolve: (val?: any) => void;
  reject: (e: Error) => void;

  constructor(props: Props, context: any) {
    super(props, context);
    this.state = {
      stage: Stage.Scanning,
      progress: 0,
      game: null,
      games: [],
      numItems: 0,
      didImport: false,
      log: "",
      showLog: false,
    };
  }

  componentDidMount() {
    dispatchTabPageUpdate(this.props, {
      label: ["preferences.scan_install_locations"],
    });

    doAsync(async () => {
      let didImport = false;
      const logger = recordingLogger(rendererLogger);
      try {
        const { numImportedItems } = await rcall(
          messages.InstallLocationsScan,
          { legacyMarketPath: legacyMarketPath() },
          (convo) => {
            hookLogging(convo, logger);
            convo.onNotification(messages.Progress, async ({ progress }) => {
              this.setState({ progress });
            });
            convo.onNotification(
              messages.InstallLocationsScanYield,
              async ({ game }) => {
                this.setState((state) => ({
                  game,
                  games: [...state.games, game],
                }));
              }
            );
            convo.onRequest(
              messages.InstallLocationsScanConfirmImport,
              async ({ numItems }) => {
                this.setState({ stage: Stage.NeedConfirm, numItems });
                let confirmPromise = new Promise((resolve, reject) => {
                  this.resolve = resolve;
                  this.reject = reject;
                });
                try {
                  await confirmPromise;
                  didImport = true;
                  this.setState({ didImport: true });
                  return { confirm: true };
                } catch (e) {
                  logger.warn(`While importing games: ${e.stack}`);
                }
                return { confirm: false };
              }
            );
          }
        );
        this.setState({ numItems: numImportedItems });
      } finally {
        this.setState({ stage: Stage.Done, log: logger.getLog() });
        const { dispatch } = this.props;
        dispatch(actions.newItemsImported({}));
        if (didImport) {
          this.onClose();
        }
      }
    });
  }

  render() {
    const { progress, game } = this.state;
    return (
      <PageScan>
        <Filler />
        {this.renderStatus()}
        <Filler />
        {this.renderButtons()}
      </PageScan>
    );
  }

  renderButtons() {
    return (
      <ModalButtons>
        <Button label={T(_("prompt.action.cancel"))} onClick={this.onClose} />
        <Filler />
        {this.renderMainButton()}
      </ModalButtons>
    );
  }

  renderMainButton() {
    const { stage } = this.state;
    switch (stage) {
      case Stage.Scanning:
        return <Button label={T(_("prompt.action.continue"))} disabled />;
      case Stage.NeedConfirm:
        const { numItems } = this.state;
        return (
          <Button
            icon="plus"
            label={T(
              _("preferences.scan_install_locations.import_items", { numItems })
            )}
            onClick={this.onConfirm}
          />
        );
      case Stage.Done:
        return (
          <Button label={T(_("prompt.action.close"))} onClick={this.onClose} />
        );
    }
    return null;
  }

  renderStatus() {
    const { stage } = this.state;
    switch (stage) {
      case Stage.Scanning:
        return this.renderScanning();
      case Stage.NeedConfirm:
        return this.renderNeedConfirm();
      case Stage.Done:
        return this.renderDone();
    }
  }

  renderScanning() {
    const { progress, game } = this.state;
    return (
      <>
        <SectionDiv>
          <WideBox>
            <BoxInner>
              <StandardGameCover game={game} />
              <FilterSpacer />
              <StandardGameDesc game={game} />
              <FilterSpacer />
            </BoxInner>
          </WideBox>
        </SectionDiv>
        <Filler />
        <SectionDiv>
          <LoadingCircle wide progress={progress} />
          <FilterSpacer />
          {T(_("preferences.scan_install_locations.looking_for_games"))}
        </SectionDiv>
      </>
    );
  }

  renderNeedConfirm() {
    const { games } = this.state;
    return (
      <ListDiv>
        <p>{T(_("preferences.scan_install_locations.message"))}</p>
        <List>
          {games.map((g) => (
            <li key={g.id}>
              <TinyCover game={g} showGifMarker={false} />
              <span>{g.title}</span>
            </li>
          ))}
        </List>
        <Filler />
      </ListDiv>
    );
  }

  onConfirm = () => {
    this.resolve();
  };

  onClose = () => {
    const { dispatch } = this.props;
    dispatch(actions.closeWind({ wind: ambientWind() }));
  };

  renderDone() {
    const { didImport, numItems, showLog, log } = this.state;
    return (
      <ListDiv>
        {didImport ? (
          <p>
            {T(
              _("preferences.scan_install_locations.items_imported", {
                numImportedItems: numItems,
              })
            )}
          </p>
        ) : (
          <p>{T(_("preferences.scan_install_locations.no_items_found"))}</p>
        )}
        <ListDivSpacer />
        {showLog ? (
          <StyledLog log={log} />
        ) : (
          <Link
            label={T(_("grid.item.view_details"))}
            onClick={this.onShowLog}
          />
        )}
      </ListDiv>
    );
  }

  onShowLog = () => {
    this.setState({ showLog: true });
  };

  componentWillUnmount() {
    if (this.reject) {
      this.reject(new Error("closed!"));
    }
  }
}

interface Props extends MeatProps {
  dispatch: Dispatch;
  tab: string;
}

interface State {
  stage: Stage;
  progress: number;
  game: Game;
  games: Game[];
  numItems: number;
  didImport: boolean;
  log: string;
  showLog: boolean;
}

export default withTab(hook()(ScanInstallLocations));
