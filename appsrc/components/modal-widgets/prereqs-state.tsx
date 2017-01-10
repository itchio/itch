
import * as React from "react";

import {connect} from "../connect";
import {createSelector, createStructuredSelector} from "reselect";
import {IModalWidgetProps} from "./modal-widget";

import {findWhere, map} from "underscore";

import downloadProgress from "../../util/download-progress";

import LoadingCircle from "../loading-circle";

import {
    IState, ITask,
    IPrereqsState,
} from "../../types";

import {ILocalizer} from "../../localizer";

export class PrereqsState extends React.Component<IPrereqsStateProps, void> {
    render() {
        const {t, prereqsState} = this.props;
        const params = this.props.modal.widgetParams as IPrereqsStateParams;

        if (!prereqsState) {
            return <div className="modal-widget">{t("setup.status.preparing")}</div>;
        }

        return <div className="modal-widget">
            <p>{t("prereq.explanation", {title: params.gameTitle})}</p>
            
            <ul>
            {map(prereqsState.tasks, (v, k) => {
                return <li key={k} className="prereqs-row">
                    <LoadingCircle progress={v.progress}/>
                    <div className="prereqs-info">
                        <div className="task-name">
                            {v.name}
                        </div>
                        <div className="task-status">
                            {v.progress > 0
                            ? (v.progress < 1
                                ? downloadProgress(t, v, false)
                                : t("prereq.status.ready_for_install"))
                            : t("setup.status.preparing")}
                        </div>
                    </div>
                </li>;
            })}
            </ul>

            <p>{prereqsState.installing
            ? t("prereq.main_status.downloading")
            : t("prereq.main_status.installing") }</p>
        </div>;
    }
}

export interface IPrereqsStateParams {
    gameId: string;
    gameTitle: string;
}

interface IPrereqsStateProps extends IModalWidgetProps {
    t: ILocalizer;

    // computed
    prereqsState: IPrereqsState;
}

interface IStructuredSelectorResult {
    tasks: ITask[];
}

const mapStateToProps = () => {
    const selector = createStructuredSelector({
        tasks: (state: IState, props: IPrereqsStateProps) => {
            const params = props.modal.widgetParams as IPrereqsStateParams;
            const tasks = state.tasks.tasksByGameId[params.gameId];
            return tasks;
        },
    });

    return createSelector(
        selector,
        (cs: IStructuredSelectorResult) => {
            const task = findWhere(cs.tasks, {name: "launch"});
            return {
                prereqsState: task ? task.prereqsState : null,
            };
        },
    );
};
const mapDispatchToProps = () => ({});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(PrereqsState);
