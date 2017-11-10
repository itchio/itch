import * as React from "react";

import { IModalWidgetProps, ModalWidgetDiv } from "./modal-widget";

import { ICave } from "../../db/models/cave";
import { fromDateTimeField } from "../../db/datetime-field";

import * as actions from "../../actions";

import format from "../format";

import Icon from "../basics/icon";

import styled from "../styles";
import { lighten } from "polished";
import { injectIntl, InjectedIntl } from "react-intl";
import {
  MONTH_YEAR_FORMAT,
  DAY_MONTH_FORMAT,
  formatDate,
} from "../../format/index";
import { DATE_FORMAT } from "../../format/datetime";
import { connect } from "../connect";
import { dispatcher } from "../../constants/action-types";
import { Game, Build } from "ts-itchio-api";

const BuildListDiv = styled.div`
  width: 100%;
  max-height: 400px;

  padding-right: 15px;

  overflow-y: scroll;

  .builds--month {
    width: 100%;
    border-left: 2px solid ${props => props.theme.accent};
    margin-top: 24px;
    padding-left: 12px;
    padding-top: 8px;
    padding-bottom: 8px;
    font-size: ${props => props.theme.fontSizes.larger};
    font-weight: bold;
  }

  .builds--item {
    display: flex;
    flex-direction: row;

    width: 100%;
    margin: 8px 0;
    background: ${props => props.theme.sidebarBackground};
    padding: 12px 16px;
    align-items: center;

    &:hover {
      cursor: pointer;
      background: ${props => lighten(0.05, props.theme.sidebarBackground)};
    }

    .item--version {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .filler {
      flex-grow: 1;
    }

    .spacer {
      flex-shrink: 0;
      width: 16px;
    }
  }

  .version--user {
    font-weight: bold;
    font-size: ${props => props.theme.fontSizes.large};
    margin-right: 16px;
  }

  .version--raw,
  .version--timeago {
    color: ${props => props.theme.secondaryText};
  }
`;

function monthFor(b: Build) {
  const date = fromDateTimeField(b.updatedAt);
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

class RevertCave extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { remoteBuilds } = this.props.modal.widgetParams as IRevertCaveParams;

    const builds: JSX.Element[] = [];
    let lastMonth = 0;
    for (const build of remoteBuilds) {
      const month = monthFor(build);
      if (month != lastMonth) {
        const monthDate = fromDateTimeField(build.updatedAt);
        builds.push(
          <div key={`month-${month}`} className="builds--month">
            {formatDate(monthDate, this.props.intl.locale, MONTH_YEAR_FORMAT)}
          </div>
        );
        lastMonth = month;
      }
      builds.push(this.renderBuild(build));
    }

    return (
      <ModalWidgetDiv>
        <BuildListDiv>{builds}</BuildListDiv>
      </ModalWidgetDiv>
    );
  }

  renderBuild(b: Build): JSX.Element {
    const version = b.userVersion || b.version;
    const updatedAt = fromDateTimeField(b.updatedAt);
    const { locale } = this.props.intl;

    return (
      <div
        className="builds--item"
        key={b.id}
        data-build-id={b.id}
        onClick={this.onClick}
      >
        <Icon icon="history" />
        <div className="spacer" />
        {version ? (
          <div className="version--user">
            {format(["prompt.revert.version", { version }])}
          </div>
        ) : null}
        <div className="version--raw">{`#${b.id}`}</div>
        <div className="filler" />
        <div className="spacer" />
        <div
          className="timeago"
          data-rh={formatDate(updatedAt, locale, DATE_FORMAT)}
        >
          {formatDate(updatedAt, locale, DAY_MONTH_FORMAT)}
        </div>
      </div>
    );
  }

  onClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    const revertBuildId = parseInt(ev.currentTarget.dataset.buildId, 10);

    this.props.closeModal({
      action: actions.modalResponse({
        revertBuildId,
      }),
    });
  };
}

export interface IRevertCaveParams {
  currentCave: ICave;
  game: Game;
  remoteBuilds: Build[];
}

interface IProps extends IModalWidgetProps {}

interface IDerivedProps {
  intl: InjectedIntl;

  closeModal: typeof actions.closeModal;
}

export default connect<IProps>(injectIntl(RevertCave), {
  dispatch: dispatch => ({
    closeModal: dispatcher(dispatch, actions.closeModal),
  }),
});
