import { Dispatch } from "common/types";
import { ambientTab } from "common/util/navigation";
import React from "react";
import Loadable from "react-loadable";
import Button from "renderer/basics/Button";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { hookWithProps } from "renderer/hocs/hook";
import { withTab } from "renderer/hocs/withTab";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled from "renderer/styles";
import { T, _ } from "renderer/t";
import FiltersContainer from "renderer/basics/FiltersContainer";
import BrowserBar from "renderer/pages/BrowserPage/BrowserBar";
import Page from "renderer/pages/common/Page";
import { actions } from "common/actions";
import { modals } from "common/modals";
import { formatError } from "common/format/errors";

const CrashyPage = Loadable({
  loader: () => import("renderer/pages/CrashyPage"),
  loading: () => null,
});
const CavePage = Loadable({
  loader: () => import("renderer/pages/CavePage"),
  loading: () => null,
});
const GamePage = Loadable({
  loader: () => import("renderer/pages/GamePage"),
  loading: () => null,
});
const InstallPage = Loadable({
  loader: () => import("renderer/pages/InstallPage"),
  loading: () => null,
});
const FeaturedPage = Loadable({
  loader: () => import("renderer/pages/FeaturedPage"),
  loading: () => null,
});
const LibraryPage = Loadable({
  loader: () => import("renderer/pages/LibraryPage"),
  loading: () => null,
});
const OwnedPage = Loadable({
  loader: () => import("renderer/pages/LibraryPage/OwnedPage"),
  loading: () => null,
});
const InstalledPage = Loadable({
  loader: () => import("renderer/pages/LibraryPage/InstalledPage"),
  loading: () => null,
});
const LocationsPage = Loadable({
  loader: () => import("renderer/pages/LocationsPage"),
  loading: () => null,
});
const LocationPage = Loadable({
  loader: () => import("renderer/pages/LocationPage"),
  loading: () => null,
});
const BrowserPage = Loadable({
  loader: () => import("renderer/pages/BrowserPage"),
  loading: () => null,
});
const NewTabPage = Loadable({
  loader: () => import("renderer/pages/NewTabPage"),
  loading: () => null,
});
const CollectionPage = Loadable({
  loader: () => import("renderer/pages/CollectionPage"),
  loading: () => null,
});
const CollectionsPage = Loadable({
  loader: () => import("renderer/pages/CollectionsPage"),
  loading: () => null,
});
const AppLogPage = Loadable({
  loader: () => import("renderer/pages/AppLogPage"),
  loading: () => null,
});
const DashboardPage = Loadable({
  loader: () => import("renderer/pages/DashboardPage"),
  loading: () => null,
});
const DownloadsPage = Loadable({
  loader: () => import("renderer/pages/DownloadsPage"),
  loading: () => null,
});
const PreferencesPage = Loadable({
  loader: () => import("renderer/pages/PreferencesPage"),
  loading: () => null,
});
const ScanInstallLocationsPage = Loadable({
  loader: () => import("renderer/pages/ScanInstallLocationsPage"),
  loading: () => null,
});

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
