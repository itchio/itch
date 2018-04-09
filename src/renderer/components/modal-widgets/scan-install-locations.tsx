import { Game } from "common/butlerd/messages";
import React from "react";
import { ModalWidgetDiv } from "./modal-widget";
import { IModalWidgetProps } from ".";
import Cover from "../basics/cover";

import LoadingCircle from "../basics/loading-circle";

import styled from "../styles";

const ContainerDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: space-between;
`;

const SectionDiv = styled.div`
  padding: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;

  .cover-container {
    flex-shrink: 0;
    width: 200px;
  }
`;

class ScanInstallLocations extends React.PureComponent<IProps> {
  render() {
    const { progress, game } = this.props.modal.widgetParams;
    return (
      <ModalWidgetDiv>
        <ContainerDiv>
          <SectionDiv>
            <LoadingCircle wide progress={progress} />
            Looking for games...
          </SectionDiv>
          <SectionDiv>
            <div className="cover-container">
              <Cover
                gameId={game ? game.id : -1}
                coverUrl={game ? game.coverUrl : null}
                stillCoverUrl={game ? game.stillCoverUrl : null}
                showGifMarker={false}
              />
            </div>
          </SectionDiv>
        </ContainerDiv>
      </ModalWidgetDiv>
    );
  }
}

export interface IScanInstallLocationsParams {
  progress: number;
  game: Game;
}

export interface IScanInstallLocationsResponse {}

interface IProps
  extends IModalWidgetProps<
      IScanInstallLocationsParams,
      IScanInstallLocationsResponse
    > {}

export default ScanInstallLocations;
