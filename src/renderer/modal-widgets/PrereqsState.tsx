import { PrereqStatus } from "common/butlerd/messages";
import { PrereqsStateParams, PrereqsStateResponse } from "common/modals/types";
import React from "react";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { map } from "underscore";
import { ModalWidgetProps } from "common/modals";
import DownloadProgressSpan from "renderer/basics/DownloadProgressSpan";
import { FilterSpacer } from "renderer/pages/common/SortsAndFilters";

class PrereqsState extends React.PureComponent<Props> {
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
                <FilterSpacer />
                <div className="prereqs-info">
                  <div className="task-name">{v.fullName}</div>
                  <div className="task-status">
                    {v.status === "downloading" && v.progress ? (
                      <DownloadProgressSpan
                        eta={v.eta}
                        bps={v.bps}
                        downloadsPaused={false}
                      />
                    ) : (
                      T([`prereq.status.${v.status}`])
                    )}
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
    color: ${(props) => props.theme.secondaryText};
  }
`;

// props

interface Props
  extends ModalWidgetProps<PrereqsStateParams, PrereqsStateResponse> {}

export default PrereqsState;
