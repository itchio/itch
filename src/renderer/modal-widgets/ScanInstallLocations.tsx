import { Game } from "common/butlerd/messages";
import React from "react";
import { IModalWidgetProps } from ".";
import Cover from "renderer/basics/Cover";
import { T } from "renderer/t";

import LoadingCircle from "renderer/basics/LoadingCircle";

import styled from "renderer/styles";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";

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

class ScanInstallLocations extends React.PureComponent<Props> {
  render() {
    const { progress, game } = this.props.modal.widgetParams;
    return (
      <ModalWidgetDiv>
        <ContainerDiv>
          <SectionDiv>
            <LoadingCircle wide progress={progress} />
            {T(["preferences.scan_install_locations.looking_for_games"])}
          </SectionDiv>
          <SectionDiv>
            <div className="cover-container">
              <Cover
                hover={false}
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

interface Props
  extends IModalWidgetProps<
      IScanInstallLocationsParams,
      IScanInstallLocationsResponse
    > {}

export default ScanInstallLocations;
