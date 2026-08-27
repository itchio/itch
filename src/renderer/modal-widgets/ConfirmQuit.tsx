import * as messages from "common/butlerd/messages";
import { ModalWidgetProps } from "common/modals";
import { ConfirmQuitParams, ConfirmQuitResponse } from "common/modals/types";
import React from "react";
import butlerCaller from "renderer/hocs/butlerCaller";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import { FilterSpacer } from "renderer/pages/common/SortsAndFilters";
import StandardGameCover from "renderer/pages/common/StandardGameCover";
import StandardGameDesc from "renderer/pages/common/StandardGameDesc";
import { Box, BoxInner } from "renderer/pages/PageStyles/boxes";

const FetchGame = butlerCaller(messages.FetchGame);

class RunningGame extends React.PureComponent<{ gameId: number }> {
  override render() {
    const { gameId } = this.props;
    return <FetchGame params={{ gameId }} render={this.renderGame} />;
  }

  renderGame = FetchGame.renderCallback(({ result }) => {
    if (result && result.game) {
      const { game } = result;
      return (
        <Box>
          <BoxInner>
            <StandardGameCover game={game} disableLink />
            <FilterSpacer />
            <StandardGameDesc game={game} disableLink />
            <FilterSpacer />
          </BoxInner>
        </Box>
      );
    }
    return null;
  });
}

export default class ConfirmQuit extends React.PureComponent<Props> {
  override render() {
    const { gameIds } = this.props.modal.widgetParams;

    return (
      <ModalWidgetDiv>
        {gameIds.map((gameId) => (
          <RunningGame gameId={gameId} key={gameId} />
        ))}
      </ModalWidgetDiv>
    );
  }
}

// props

interface Props
  extends ModalWidgetProps<ConfirmQuitParams, ConfirmQuitResponse> {}
