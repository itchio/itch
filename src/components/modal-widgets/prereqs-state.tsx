import * as React from "react";
import { createSelector, createStructuredSelector } from "reselect";
import { connect, I18nProps } from "../connect";

import { findWhere, map } from "underscore";

import { downloadProgress } from "../../format";

import { IModalWidgetProps, ModalWidgetDiv } from "./modal-widget";
import LoadingCircle from "../basics/loading-circle";

import { IAppState, ITask, IPrereqsState } from "../../types";

export class PrereqsState extends React.PureComponent<
  IProps & IDerivedProps & I18nProps,
  void
> {
  render() {
    const { t, prereqsState } = this.props;
    const params = this.props.modal.widgetParams as IPrereqsStateParams;

    if (!prereqsState) {
      return <ModalWidgetDiv>{t("setup.status.preparing")}</ModalWidgetDiv>;
    }

    return (
      <ModalWidgetDiv>
        <p>{t("prereq.explanation", { title: params.gameTitle })}</p>

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
                      ? downloadProgress(t, v, false)
                      : t(`prereq.status.${v.status}`)}
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
      tasks: (state: IAppState, props: IProps) => {
        const params = props.modal.widgetParams as IPrereqsStateParams;
        const tasks = state.tasks.tasksByGameId[params.gameId];
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
