import React from "react";

import styled from "../styles";
import SelectRow from "./select-row";
import IconButton from "./icon-button";
import Filler from "./filler";

import { FormattedTime } from "react-intl";
import _ from "underscore";

// time, module, message
const numColumns = 3;

const levels = {
  default: "user",
  "60": "fatal",
  "50": "error",
  "40": "warn",
  "30": "info",
  "20": "debug",
  "10": "trace",
};

const reverseLevels = {
  fatal: "60",
  error: "50",
  warn: "40",
  info: "30",
  debug: "20",
  trace: "10",
};

const LogContainer = styled.div`
  width: 100%;
  height: 100%;
`;

const LogControls = styled.div`
  padding-bottom: 1em;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const LogTable = styled.table`
  background: ${props => props.theme.sidebarBackground};
  width: 100%;
  height: 100%;

  tbody {
    overflow-y: scroll;
    height: 100%;

    display: block;
    tr {
      display: table;
    }
  }

  td {
    padding: 0 0.5em;
    padding-left: 0;
    line-height: 1.4;
    color: ${props => props.theme.secondaryText};
    font-size: ${props => props.theme.fontSizes.smaller};

    &.fatal {
      background: #cd3131;
      color: white;
    }

    &.error {
      color: #c53030;
    }

    &.warn {
      color: #d3d310;
    }

    &.info {
      color: #138ba8;
    }

    &.debug {
      color: #357ac6;
    }

    &.timecol,
    &.modcol {
      white-space: nowrap;
    }

    &.msgcol {
      white-space: pre-wrap;
    }

    &.timecol {
      color: ${props => props.theme.ternaryText};
    }
  }
`;

const kMaxLines = 250;

class Log extends React.PureComponent<IProps, IState> {
  constructor(props: Log["props"], context) {
    super(props, context);
    this.state = {
      level: reverseLevels["info"],
    };
  }

  render() {
    let level = parseInt(this.state.level, 10);
    const { log, className, extraControls } = this.props;
    let lines = log.split("\n");

    let entries = lines.map(x => {
      // TODO: use fast-json-parse instead ?
      try {
        const entry = JSON.parse(x);
        return entry.hasOwnProperty("msg") ? entry : x;
      } catch (e) {
        return x;
      }
    });
    entries = _.filter(entries, x => (x.level ? x.level >= level : false));
    entries = _.last(entries, kMaxLines);

    return (
      <LogContainer className={className}>
        <LogControls>
          <label>
            {"Level: "}
            <SelectRow
              options={[
                { label: "Debug", value: reverseLevels["debug"] },
                { label: "Info", value: reverseLevels["info"] },
                { label: "Warning", value: reverseLevels["warn"] },
                { label: "Error", value: reverseLevels["error"] },
              ]}
              value={this.state.level}
              onChange={this.onChangeLevel}
            />
          </label>
          {extraControls}
          <Filler />
          <IconButton icon="caret-down" onClick={this.onJumpDown} />
        </LogControls>
        <LogTable>
          <tbody ref={this.gotBody}>
            {entries.map((x, i) => {
              if (x.hasOwnProperty("msg")) {
                // TODO: show date jumps
                return (
                  <tr key={i}>
                    <td className="timecol">
                      <FormattedTime value={x.time} />
                    </td>
                    <td className="modcol">
                      {x.name ? <span>{x.name}</span> : null}
                    </td>
                    <td className={levels[x.level] + " msgcol"}>{x.msg}</td>
                  </tr>
                );
              } else {
                return (
                  <tr key={i}>
                    <td colSpan={numColumns}>{x}</td>
                  </tr>
                );
              }
            })}
          </tbody>
        </LogTable>
      </LogContainer>
    );
  }

  componentDidUpdate() {
    this.scrollDown();
  }

  tbody: HTMLElement;

  gotBody = (tbody: HTMLElement) => {
    this.tbody = tbody;
    this.scrollDown();
  };

  scrollDown() {
    if (!this.tbody) {
      return;
    }

    this.tbody.scrollTop = this.tbody.scrollHeight;
  }

  onChangeLevel = (value: string) => {
    this.setState({ level: value });
  };

  onJumpDown = () => {
    this.scrollDown();
  };
}

export default Log;

interface IState {
  level: string;
}

interface IProps {
  log: string;
  className?: string;
  extraControls?: JSX.Element;
}
