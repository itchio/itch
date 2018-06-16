import { Space } from "common/helpers/space";
import { TabInstance } from "common/types";
import React from "react";
import Button from "renderer/basics/Button";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { withTabInstance } from "renderer/hocs/withTabInstance";
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
import LocationsPage from "renderer/pages/LocationsPage";
import PreferencesPage from "renderer/pages/PreferencesPage";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled from "renderer/styles";
import { T } from "renderer/t";

const showHistory = process.env.ITCH_SHOW_HISTORY === "1";

const HistoryDiv = styled.div`
  position: absolute;
  pointer-events: none;
  z-index: 1000;
  top: 20px;
  right: 20px;
  background: rgba(128, 40, 40, 0.9);
  color: white;
  padding: 10px;
  border-radius: 4px;
  line-height: 1.4;
  min-width: 400px;

  ul {
    margin-top: 1em;
  }

  .resource {
    color: rgb(130, 130, 220);
    font-weight: bold;
  }
`;

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
    const ti = props.tabInstance;
    const { url } = ti.history[ti.currentIndex];
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

    const inst = this.props.tabInstance;
    const sp = Space.fromInstance(inst);
    const ConcreteMeat = this.getConcrete(sp);

    if (ConcreteMeat) {
      return (
        <>
          {showHistory ? (
            <HistoryDiv>
              <h2>History</h2>
              <ul>
                {inst.history.map((el, i) => {
                  return (
                    <li
                      key={i}
                      style={{
                        color: i === inst.currentIndex ? "white" : "#aaa",
                      }}
                    >
                      {i} {el.url}{" "}
                      {el.resource ? (
                        <span className="resource">{el.resource}</span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </HistoryDiv>
          ) : null}
          <ConcreteMeat {...this.props} />
        </>
      );
    } else {
      return <div>Invalid url: {JSON.stringify(sp.url())}</div>;
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
        return LibraryPage;
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
      case "dashboard":
        return DashboardPage;
      case "downloads":
        return DownloadsPage;
      case "preferences":
        return PreferencesPage;
      case "locations":
        return LocationsPage;
      case "applog":
        return AppLogPage;
      case "crashy":
        return CrashyPage;
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
  tabInstance: TabInstance;
}

// FIXME: this is bad
export default withTabInstance(Meat);
