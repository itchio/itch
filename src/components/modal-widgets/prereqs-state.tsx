import * as React from "react";
import { createSelector, createStructuredSelector } from "reselect";
import { connect } from "../connect";

import { findWhere, map } from "underscore";

import { downloadProgress } from "../../format";

import { IModalWidgetProps, ModalWidgetDiv } from "./modal-widget";
import LoadingCircle from "../basics/loading-circle";

import { IRootState, ITask, IPrereqsState } from "../../types";

import format from "../format";

export class PrereqsState extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { prereqsState } = this.props;
    const params = this.props.modal.widgetParams as IPrereqsStateParams;

    if (!prereqsState) {
      return (
        <ModalWidgetDiv>
          {format(["setup.status.preparing"])}
        </ModalWidgetDiv>
      );
    }

    return (
      <ModalWidgetDiv>
        <p>
          {format(["prereq.explanation", { title: params.gameTitle }])}
        </p>

        <ul className="prereqs-rows">
          {map(prereqsState.tasks, (v, k) => {
            let progress = v.progress;
            if (v.status === "installing" || v.status === "extracting") {
              // just displays a spinner
              progress = 0.1;
            }

            return (
              <li key={k} className="prereqs-row" style={{ order: v.order }}>
                <LoadingCircle progress={progress} />
                <div className="prereqs-info">
                  <div className="task-name">
                    {v.name}
                  </div>
                  <div className="task-status">
                    {v.status === "downloading" && v.progress
                      ? downloadProgress(v, false)
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
  gameId: string;
  gameTitle: string;
}

interface IProps extends IModalWidgetProps {}

interface IDerivedProps {
  prereqsState: IPrereqsState;
}

interface IStructuredSelectorResult {
  tasks: ITask[];
}

export default connect<IProps>(PrereqsState, {
  state: () => {
    const selector = createStructuredSelector({
      tasks: (rs: IRootState, props: IProps) => {
        const params = props.modal.widgetParams as IPrereqsStateParams;
        const tasks = rs.tasks.tasksByGameId[params.gameId];
        return tasks;
      },
    });

    return createSelector(selector, (cs: IStructuredSelectorResult) => {
      const task = findWhere(cs.tasks, { name: "launch" });
      return {
        prereqsState: task ? task.prereqsState : null,
      };
    });
  },
});
