import styled from "styled-components";
import { Game, Upload } from "@itchio/valet/messages";
import React from "react";
import { fontSizes } from "renderer/theme";
import { gameCover } from "common/game-cover";

let coverWidth = 290;
let coverHeight = 230;

let ratio = 0.4;

const GameBox = styled.div`
  width: 100%;
  padding: 4px;

  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Cover = styled.img`
  width: ${coverWidth * ratio}px;
  height: ${coverHeight * ratio}px;

  margin-right: 10px;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;

  line-height: 1.6;
`;

const Title = styled.div`
  font-size: ${fontSizes.enormous};
  font-weight: 900;
`;

const ShortText = styled.div`
  font-size: ${fontSizes.normal};
  color: ${(p) => p.theme.colors.text2};
`;

export const SimpleGameRow = (props: { game: Game; upload?: Upload }) => {
  const { game } = props;

  return (
    <GameBox>
      <Cover src={gameCover(game)} />
      <Info>
        <Title>{game.title}</Title>
        <ShortText>{game.shortText}</ShortText>
        <a href={game.url}>{game.url}</a>
      </Info>
    </GameBox>
  );
};
