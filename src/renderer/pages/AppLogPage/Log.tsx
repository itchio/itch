import React from "react";
import { FormattedTime, FormattedDate } from "react-intl";
import Filler from "renderer/basics/Filler";
import IconButton from "renderer/basics/IconButton";
import SelectRow from "renderer/basics/SelectRow";
import styled from "renderer/styles";
import _ from "underscore";
import { T } from "renderer/t";
import Button from "renderer/basics/Button";

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
} as { [key: string]: string };

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
  background: ${(props) => props.theme.sidebarBackground};
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
    color: ${(props) => props.theme.secondaryText};
    font-size: ${(props) => props.theme.fontSizes.smaller};

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
      color: ${(props) => props.theme.ternaryText};
    }
  }
`;

const levelOptions = [
  { label: ["log.level.debug"], value: reverseLevels["debug"] },
  { label: ["log.level.info"], value: reverseLevels["info"] },
  { label: ["log.level.warning"], value: reverseLevels["warn"] },
  { label: ["log.level.error"], value: reverseLevels["error"] },
];
const linesPerPage = 250;

class Log extends React.PureComponent<Props, State> {
  constructor(props: Log["props"], context: any) {
    super(props, context);
    this.state = {
      level: reverseLevels["info"],
      maxLines: linesPerPage,
    };
  }

  render() {
    const { maxLines } = this.state;
    let level = parseInt(this.state.level, 10);
    const { log, className, extraControls } = this.props;
    let lines = log.split("\n");

    let entries = lines.map((x) => {
      // TODO: use fast-json-parse instead ?
      try {
        const entry = JSON.parse(x);
        return entry.hasOwnProperty("msg") ? entry : x;
      } catch (e) {
        return x;
      }
    });
    entries = _.filter(entries, (x) => (x.level ? x.level >= level : false));
    let hasMore = _.size(entries) > maxLines;
    entries = _.last(entries, maxLines);

    return (
      <LogContainer className={className}>
        <LogControls>
          <label>
            {T(["log.level"])}
            {": "}
            <SelectRow
              options={levelOptions}
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
            {hasMore ? (
              <div style={{ margin: "20px" }}>
                <Button onClick={this.onLoadMore} label="Load more..." />
              </div>
            ) : null}
            {entries.map((x, i) => {
              if (x.hasOwnProperty("msg")) {
                let jumpElement: JSX.Element;
                let previousEntry = entries[i - 1];
                if (x.time) {
                  const currDate = new Date(x.time);
                  const prevDate = previousEntry
                    ? new Date(previousEntry.time)
                    : null;
                  if (
                    !previousEntry ||
                    !previousEntry.time ||
                    currDate.getUTCDate() != prevDate.getUTCDate() ||
                    currDate.getUTCMonth() != prevDate.getUTCMonth() ||
                    currDate.getUTCFullYear() != currDate.getUTCFullYear()
                  ) {
                    jumpElement = (
                      <tr key={`${i}-jump`}>
                        <td colSpan={3}>
                          <FormattedDate
                            month="long"
                            year="numeric"
                            day="numeric"
                            value={x.time}
                          />
                        </td>
                      </tr>
                    );
                  }
                }

                return (
                  <>
                    {jumpElement}
                    <tr key={i}>
                      <td className="timecol">
                        <FormattedTime value={x.time} />
                      </td>
                      <td className="modcol">
                        {x.name ? <span>{x.name}</span> : null}
                      </td>
                      <td className={levels[x.level] + " msgcol"}>{x.msg}</td>
                    </tr>
                  </>
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

  onLoadMore = () => {
    this.setState((state) => ({
      maxLines: state.maxLines + linesPerPage,
    }));
  };

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

  scrollTop() {
    if (!this.tbody) {
      return;
    }

    this.tbody.scrollTop = 0;
  }

  onChangeLevel = (value: string) => {
    this.setState({ level: value });
  };

  onJumpDown = () => {
    this.scrollDown();
  };
}

export default Log;

interface State {
  level: string;
  maxLines: number;
}

interface Props {
  log: string;
  className?: string;
  extraControls?: JSX.Element;
}
