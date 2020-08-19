import { actions } from "common/actions";
import { Build } from "common/butlerd/messages";
import { DAY_MONTH_FORMAT, MONTH_YEAR_FORMAT } from "common/format/datetime";
import { ModalWidgetProps } from "common/modals";
import {
  SwitchVersionCaveParams,
  SwitchVersionCaveResponse,
} from "common/modals/types";
import { Dispatch } from "common/types";
import { ambientWind } from "common/util/navigation";
import { lighten } from "polished";
import React from "react";
import Icon from "renderer/basics/Icon";
import { hook } from "renderer/hocs/hook";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import CustomDate from "renderer/modal-widgets/SwitchVersionCave/CustomDate";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { isEmpty } from "underscore";

const BuildListDiv = styled.div`
  width: 100%;
  max-height: 400px;

  padding-right: 15px;

  overflow-y: scroll;

  .builds--month {
    width: 100%;
    border-left: 2px solid ${(props) => props.theme.accent};
    margin-top: 24px;
    padding-left: 12px;
    padding-top: 8px;
    padding-bottom: 8px;
    font-size: ${(props) => props.theme.fontSizes.larger};
    font-weight: bold;
  }

  .builds--item {
    display: flex;
    flex-direction: row;

    width: 100%;
    margin: 8px 0;
    background: ${(props) => props.theme.sidebarBackground};
    padding: 12px 16px;
    align-items: center;

    &:hover {
      cursor: pointer;
      background: ${(props) => lighten(0.05, props.theme.sidebarBackground)};
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
    font-size: ${(props) => props.theme.fontSizes.large};
    margin-right: 16px;
  }

  .version--raw,
  .version--timeago {
    color: ${(props) => props.theme.secondaryText};
  }
`;

function monthFor(b: Build): number {
  const date = new Date(b.updatedAt);
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

class SwitchVersionCave extends React.PureComponent<Props> {
  render() {
    const { builds } = this.props.modal.widgetParams;

    const buildElements: JSX.Element[] = [];
    if (isEmpty(builds)) {
      buildElements.push(<>{T(["prompt.revert.no_other_version"])}</>);
    } else {
      let lastMonth = 0;
      for (let index = 0; index < builds.length; index++) {
        const build = builds[index];
        const month = monthFor(build);
        if (month != lastMonth) {
          const monthDate = build.updatedAt;
          buildElements.push(
            <div key={`month-${month}`} className="builds--month">
              <CustomDate
                date={new Date(monthDate)}
                format={MONTH_YEAR_FORMAT}
              />
            </div>
          );
          lastMonth = month;
        }
        buildElements.push(this.renderBuild(index, build));
      }
    }

    return (
      <ModalWidgetDiv>
        <BuildListDiv>{buildElements}</BuildListDiv>
      </ModalWidgetDiv>
    );
  }

  renderBuild(index: number, b: Build): JSX.Element {
    const version = b.userVersion || b.version;
    const updatedAt = b.updatedAt;

    return (
      <div
        className="builds--item"
        key={b.id}
        data-index={index}
        onClick={this.onClick}
      >
        <Icon icon="history" />
        <div className="spacer" />
        {version ? (
          <div className="version--user">
            {T(["prompt.revert.version", { version }])}
          </div>
        ) : null}
        <div className="version--raw">{`#${b.id}`}</div>
        <div className="filler" />
        <div className="spacer" />
        <div className="timeago" data-rh={JSON.stringify({ date: updatedAt })}>
          <CustomDate date={updatedAt} format={DAY_MONTH_FORMAT} />
        </div>
      </div>
    );
  }

  onClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    const index = parseInt(ev.currentTarget.dataset.index, 10);
    const res: SwitchVersionCaveResponse = { index };
    const { dispatch } = this.props;
    dispatch(
      actions.closeModal({
        wind: ambientWind(),
        action: actions.modalResponse(res),
      })
    );
  };
}

interface Props
  extends ModalWidgetProps<SwitchVersionCaveParams, SwitchVersionCaveResponse> {
  dispatch: Dispatch;
}

export default hook()(SwitchVersionCave);
