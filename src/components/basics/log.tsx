import * as React from "react";

import styled from "../styles";
import { FormattedTime } from "react-intl";

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

const LogTable = styled.table`
  background: ${props => props.theme.sidebarBackground};
  margin: 1em 0;
  padding: 1em;

  tbody {
    max-height: 4em;
    overflow-y: scroll;
  }

  td {
    padding: 0 .5em;
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

export default class Log extends React.PureComponent<IProps> {
  render() {
    const { log } = this.props;
    const entries = log.split("\n").map(x => {
      // TODO: use fast-json-parse instead ?
      try {
        return JSON.parse(x);
      } catch (e) {
        return x;
      }
    });

    return (
      <LogTable>
        <tbody>
          {entries.map(x => {
            if (x.msg) {
              // TODO: show date jumps
              return (
                <tr>
                  <td className="timecol">
                    <FormattedTime value={x.time} />
                  </td>
                  <td className="modcol">
                    {x.name
                      ? <span>
                          {x.name}
                        </span>
                      : null}
                  </td>
                  <td className={levels[x.level] + " msgcol"}>
                    {x.msg}
                  </td>
                </tr>
              );
            } else {
              return (
                <tr>
                  <td colSpan={numColumns}>
                    {x}
                  </td>
                </tr>
              );
            }
          })}
        </tbody>
      </LogTable>
    );
  }
}

interface IProps {
  log: string;
}
