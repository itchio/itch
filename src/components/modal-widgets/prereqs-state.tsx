import * as React from "react";
import { map } from "underscore";

import { downloadProgress } from "../../format";
import { ModalWidgetDiv } from "./modal-widget";
import LoadingCircle from "../basics/loading-circle";

import format from "../format";
import { IModalWidgetProps } from "./index";
import { PrereqStatus } from "node-buse/lib/messages";

class PrereqsState extends React.PureComponent<IProps> {
  render() {
    const { gameTitle, tasks } = this.props.modal.widgetParams;

    return (
      <ModalWidgetDiv>
        <p>{format(["prereq.explanation", { title: gameTitle }])}</p>

        <ul className="prereqs-rows">
          {map(tasks, (v, name) => {
            let progress = v.progress;
            if (v.status === "installing") {
              // just displays a spinner
              progress = 0.1;
            }

            return (
              <li key={name} className="prereqs-row" style={{ order: v.order }}>
                <LoadingCircle progress={progress} />
                <div className="prereqs-info">
                  <div className="task-name">{v.fullName}</div>
                  <div className="task-status">
                    {v.status === "downloading" && v.progress
                      ? downloadProgress({ eta: v.eta, bps: v.bps }, false)
                      : format([`prereq.status.${v.status}`])}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </ModalWidgetDiv>
    );
  }
}

export interface IPrereqsStateParams {
  gameTitle: string;
  tasks: {
    [prereqName: string]: ITaskProgressState;
  };
}

export interface ITaskProgressState {
  order: number;
  fullName: string;
  status: PrereqStatus;
  progress: number;
  eta: number;
  bps: number;
}

interface IPrereqsStateResponse {}

interface IProps
  extends IModalWidgetProps<IPrereqsStateParams, IPrereqsStateResponse> {}

export default PrereqsState;
