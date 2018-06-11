import React from "react";
import { IMeatProps } from "renderer/components/meats/types";

import Library from "renderer/components/library";
import Collections from "renderer/components/collections";
import Dashboard from "renderer/components/dashboard";
import Preferences from "renderer/components/preferences";
import Downloads from "renderer/components/downloads";
import Collection from "renderer/components/collection";
import Browser from "renderer/components/url-meat";
import Location from "renderer/components/location";
import AppLog from "renderer/components/app-log";
import { Space } from "common/helpers/space";

const showHistory = process.env.ITCH_SHOW_HISTORY === "1";

import styled from "../styles";
import Crashy from "renderer/components/crashy";
import Button from "../basics/button";
import LoadingCircle from "../basics/loading-circle";
import { T } from "renderer/t";

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

class Meat extends React.PureComponent<IProps, IState> {
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

  getConcrete(sp: Space): React.ComponentClass<IMeatProps> {
    if (sp.isBrowser()) {
      return Browser;
    }

    switch (sp.internalPage()) {
      case "library":
        return Library;
      case "collections":
        if (sp.firstPathElement()) {
          return Collection;
        } else {
          return Collections;
        }
      case "dashboard":
        return Dashboard;
      case "downloads":
        return Downloads;
      case "preferences":
        return Preferences;
      case "locations":
        return Location;
      case "applog":
        return AppLog;
      case "crashy":
        return Crashy;
      default:
        return null;
    }
  }
}

interface IState {
  hasError: boolean;
  loading: boolean;
  error?: any;
  info?: any;
  lastURL: string;
}

export default Meat;

interface IProps extends IMeatProps {}
