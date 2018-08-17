import Loadable from "react-loadable";
import { Space } from "common/helpers/space";
import React from "react";
import Button from "renderer/basics/Button";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { withSpace } from "renderer/hocs/withSpace";

const CrashyPage = Loadable({
  loader: () => import("renderer/pages/CrashyPage"),
  loading: () => null,
});
const GamePage = Loadable({
  loader: () => import("renderer/pages/GamePage"),
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

import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled from "renderer/styles";
import { T } from "renderer/t";

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
  constructor(props: Meat["props"], context: any) {
    super(props, context);
    this.state = {
      hasError: false,
      loading: false,
      lastURL: null,
    };
  }

  static getDerivedStateFromProps(
    props: Meat["props"],
    state: Meat["state"]
  ): Partial<Meat["state"]> {
    const url = props.space.url();
    if (url !== state.lastURL) {
      return {
        hasError: false,
        loading: false,
        error: null,
        info: null,
        lastURL: url,
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

    const { space } = this.props;
    const ConcreteMeat = this.getConcrete(space);

    if (ConcreteMeat) {
      return (
        <>
          <ConcreteMeat {...this.props} />
        </>
      );
    } else {
      return <div>Invalid url: {JSON.stringify(space.url())}</div>;
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
          <Button
            icon="repeat"
            onClick={() => {
              this.setState({ loading: true });
              setTimeout(() => {
                this.setState({ hasError: false, loading: false });
              }, 400);
            }}
          >
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

  onReportIssue = () => {
    // TODO: open window with issue reporting
    window.alert("Should open modal!");
  };

  getConcrete(sp: Space): React.ComponentType<MeatProps> {
    if (sp.isBrowser()) {
      return BrowserPage;
    }

    switch (sp.internalPage()) {
      case "library":
        switch (sp.firstPathElement()) {
          case "owned":
            return OwnedPage;
          case "installed":
            return InstalledPage;
          default:
            return LibraryPage;
        }
      case "games":
        return GamePage;
      case "featured":
        return FeaturedPage;
      case "collections":
        if (sp.firstPathElement()) {
          return CollectionPage;
        } else {
          return CollectionsPage;
        }
      case "locations":
        if (sp.firstPathElement()) {
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
  space: Space;
}

export default withSpace(Meat);
