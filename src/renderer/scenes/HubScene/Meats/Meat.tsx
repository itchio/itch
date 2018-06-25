import { Space } from "common/helpers/space";
import React from "react";
import Button from "renderer/basics/Button";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { withSpace } from "renderer/hocs/withSpace";
import AppLogPage from "renderer/pages/AppLogPage";
import BrowserPage from "renderer/pages/BrowserPage";
import CollectionPage from "renderer/pages/CollectionPage";
import CollectionsPage from "renderer/pages/CollectionsPage";
import CrashyPage from "renderer/pages/CrashyPage";
import DashboardPage from "renderer/pages/DashboardPage";
import DownloadsPage from "renderer/pages/DownloadsPage";
import FeaturedPage from "renderer/pages/FeaturedPage";
import GamePage from "renderer/pages/GamePage";
import LibraryPage from "renderer/pages/LibraryPage";
import InstalledPage from "renderer/pages/LibraryPage/InstalledPage";
import OwnedPage from "renderer/pages/LibraryPage/OwnedPage";
import LocationsPage from "renderer/pages/LocationsPage";
import LocationPage from "renderer/pages/LocationPage";
import PreferencesPage from "renderer/pages/PreferencesPage";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled from "renderer/styles";
import { T } from "renderer/t";
import PreloadPage from "renderer/pages/PreloadPage";

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

  static getDerivedStateFromProps(props: Meat["props"], state: Meat["state"]) {
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

  componentDidCatch(error, info) {
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
      case "preload":
        return PreloadPage;
      case "new-tab":
        return BrowserPage;
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
