import React from "react";
import { map } from "underscore";

import { ModalWidgetDiv } from "./modal-widget";
import LoadingCircle from "../basics/loading-circle";

import { T } from "renderer/t";
import { IModalWidgetProps } from "./index";
import { PrereqStatus } from "common/butlerd/messages";
import styled from "../styles";
import { downloadProgress } from "common/format/download-progress";

class PrereqsState extends React.PureComponent<IProps> {
  render() {
    const { gameTitle, tasks } = this.props.modal.widgetParams;

    return (
      <ModalWidgetDiv>
        <p>{T(["prereq.explanation", { title: gameTitle }])}</p>

        <PrereqsRows>
          {map(tasks, (v, name) => {
            let progress = v.progress;
            switch (v.status) {
              case PrereqStatus.Installing: {
                progress = -1; // indeterminate
                break;
              }
              case PrereqStatus.Done: {
                progress = 1;
                break;
              }
            }

            return (
              <PrereqsRow key={name} style={{ order: v.order }}>
                <LoadingCircle progress={progress} />
                <div className="prereqs-info">
                  <div className="task-name">{v.fullName}</div>
                  <div className="task-status">
                    {v.status === "downloading" && v.progress
                      ? downloadProgress({ eta: v.eta, bps: v.bps }, false)
                      : T([`prereq.status.${v.status}`])}
                  </div>
                </div>
              </PrereqsRow>
            );
          })}
        </PrereqsRows>
      </ModalWidgetDiv>
    );
  }
}

const PrereqsRows = styled.ul`
  display: flex;
  flex: 0 1;
  flex-direction: column;
  align-content: flex-start;
`;

const PrereqsRow = styled.li`
  display: flex;
  flex: 0 1;
  flex-direction: row;
  align-items: center;
  margin: 14px 0;
  margin-left: 10px;

  .task-status {
    margin-top: 5px;
    font-size: 80%;
    color: ${props => props.theme.secondaryText};
  }
`;

// props

export interface IPrereqsStateParams {
  gameTitle: string;
  tasks: {
    [prereqName: string]: ITaskProgressState;
  };
}

interface ITaskProgressState {
  order: number;
  fullName: string;
  status: PrereqStatus;
  progress: number;
  eta: number;
  bps: number;
}

interface IProps extends IModalWidgetProps<IPrereqsStateParams, void> {}

export default PrereqsState;
