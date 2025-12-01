import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import Button from "renderer/basics/Button";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { hookWithProps } from "renderer/hocs/hook";
import { withTab } from "renderer/hocs/withTab";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";
import BrowserBar from "renderer/pages/BrowserPage/BrowserBar";
import Page from "renderer/pages/common/Page";
import { actions } from "common/actions";
import modals from "renderer/modals";

import CrashyPage from "renderer/pages/CrashyPage";
import CavePage from "renderer/pages/CavePage";
import GamePage from "renderer/pages/GamePage";
import InstallPage from "renderer/pages/InstallPage";
import FeaturedPage from "renderer/pages/FeaturedPage";
import LibraryPage from "renderer/pages/LibraryPage";
import OwnedPage from "renderer/pages/LibraryPage/OwnedPage";
import InstalledPage from "renderer/pages/LibraryPage/InstalledPage";
import LocationsPage from "renderer/pages/LocationsPage";
import LocationPage from "renderer/pages/LocationPage";
import BrowserPage from "renderer/pages/BrowserPage";
import NewTabPage from "renderer/pages/NewTabPage";
import CollectionPage from "renderer/pages/CollectionPage";
import CollectionsPage from "renderer/pages/CollectionsPage";
import AppLogPage from "renderer/pages/AppLogPage";
import DashboardPage from "renderer/pages/DashboardPage";
import DownloadsPage from "renderer/pages/DownloadsPage";
import PreferencesPage from "renderer/pages/PreferencesPage";
import ScanInstallLocationsPage from "renderer/pages/ScanInstallLocationsPage";

const ErrorDiv = styled.div`
  display: block;
  overflow: hidden;
  margin: 20px;
  width: 100%;
`;

const ErrorContents = styled.div`
  overflow-y: scroll;
  max-height: fill-available;
  padding: 20px 0;

  pre {
    font-family: monospace;
    font-size: 12px;
    line-height: 1.4;
  }
`;

const ErrorHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ErrorButtons = styled.div`
  margin: 20px 0;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const ErrorSpacer = styled.div`
  height: 1px;
  width: 8px;
`;

class Meat extends React.PureComponent<Props, State> {
  constructor(props: Props, context: any) {
    super(props, context);
    this.state = {
      hasError: false,
      loading: false,
      lastURL: null,
    };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> {
    if (props.url !== state.lastURL) {
      return {
        hasError: false,
        loading: false,
        error: null,
        info: null,
        lastURL: props.url,
      };
    }
    return null;
  }

  componentDidCatch(error: any, info: any) {
    this.setState({
      hasError: true,
      loading: false,
      error,
      info,
    });
  }

  render() {
    if (this.state.hasError) {
      return this.renderError();
    }
    const ConcreteMeat = this.getConcrete();

    if (ConcreteMeat) {
      return (
        <>
          <ConcreteMeat {...this.props} />
        </>
      );
    } else {
      return (
        <Page>
          <BrowserBar />
          <div>Invalid url: {JSON.stringify(this.props.url)}</div>
        </Page>
      );
    }
  }

  renderError = () => {
    const { error, info } = this.state;

    return (
      <ErrorDiv>
        <ErrorHeader>
          <h3>itch has encountered a rendering error</h3>
        </ErrorHeader>

        <ErrorButtons>
          <Button icon="repeat" onClick={this.reloadMeat}>
            {this.state.loading ? <LoadingCircle progress={-1} /> : "Reload"}
          </Button>
          <ErrorSpacer />
          <Button icon="bug" onClick={this.onReportIssue}>
            {T(["menu.help.report_issue"])}
          </Button>
        </ErrorButtons>

        <details>
          <summary>View details for nerds</summary>
          <ErrorContents>
            <p>
              <pre>
                {error
                  ? error.stack
                    ? error.stack
                    : String(error)
                  : "(no error)"}
              </pre>
            </p>
            <p>
              <pre>{info ? info.componentStack : "(no component stack)"}</pre>
            </p>
          </ErrorContents>
        </details>
      </ErrorDiv>
    );
  };

  reloadMeat = () => {
    this.setState({ loading: true });
    setTimeout(() => {
      this.setState({ hasError: false, loading: false });
    }, 400);
  };

  onReportIssue = () => {
    const { dispatch } = this.props;
    const e = this.state.error;
    dispatch(
      actions.openModal(
        modals.sendFeedback.make({
          wind: "root",
          title: _("prompt.show_error.generic_message"),
          widgetParams: {
            log: `While rendering ${this.props.url}, caught:\n${e.stack}`,
          },
        })
      )
    );
  };

  getConcrete(): React.ComponentType<MeatProps> {
    const { isBrowser, internalPage, firstPathElement } = this.props;
    if (isBrowser) {
      return BrowserPage;
    }

    switch (internalPage) {
      case "library":
        switch (firstPathElement) {
          case "owned":
            return OwnedPage;
          case "installed":
            return InstalledPage;
          default:
            return LibraryPage;
        }
      case "games":
        return GamePage;
      case "caves":
        return CavePage;
      case "install":
        return InstallPage;
      case "featured":
        return FeaturedPage;
      case "collections":
        if (firstPathElement) {
          return CollectionPage;
        } else {
          return CollectionsPage;
        }
      case "locations":
        if (firstPathElement) {
          return LocationPage;
        } else {
          return LocationsPage;
        }
      case "dashboard":
        return DashboardPage;
      case "downloads":
        return DownloadsPage;
      case "preferences":
        return PreferencesPage;
      case "applog":
        return AppLogPage;
      case "crashy":
        return CrashyPage;
      case "new-tab":
        return NewTabPage;
      case "scan-install-locations":
        return ScanInstallLocationsPage;
      default:
        return null;
    }
  }
}

interface State {
  hasError: boolean;
  loading: boolean;
  error?: any;
  info?: any;
  lastURL: string;
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;

  url: string;
  isBrowser: boolean;
  internalPage: string;
  firstPathElement: string;
}

export default withTab(
  hookWithProps(Meat)((map) => ({
    url: map((rs, props) => ambientTab(rs, props).location.url),
    isBrowser: map((rs, props) => ambientTab(rs, props).location.isBrowser),
    internalPage: map(
      (rs, props) => ambientTab(rs, props).location.internalPage
    ),
    firstPathElement: map(
      (rs, props) => ambientTab(rs, props).location.firstPathElement
    ),
  }))(Meat)
);
