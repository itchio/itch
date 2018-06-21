import React from "react";
import styled from "renderer/styles";
import { urlForGame } from "common/util/navigation";
import { GameCover } from "renderer/basics/Cover";
import { Game } from "common/butlerd/messages";

//-----------------------------------
// Cover
//-----------------------------------

const CoverBox = styled.div`
  flex-shrink: 0;
  width: 130px;
  margin-right: 14px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
`;

export const StandardGameCover = ({ game, ...restProps }: { game: Game }) => (
  <CoverBox {...restProps}>
    <a href={urlForGame(game.id)}>
      <GameCover game={game} />
    </a>
  </CoverBox>
);

//-----------------------------------
// Description
//-----------------------------------

export const TitleBox = styled.div`
  padding: 8px 0;
  align-self: flex-start;
`;

export const Title = styled.div`
  font-size: ${props => props.theme.fontSizes.huge};
  font-weight: lighter;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

export const TitleSpacer = styled.div`
  width: 8px;
`;

export const Desc = styled.div`
  color: ${props => props.theme.secondaryText};
`;
