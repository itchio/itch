import { Game } from "common/butlerd/messages";
import React from "react";
import styled from "renderer/styles";

const SaleRibbon = styled.div`
  position: absolute;
  right: 0;
  bottom: 0;
  background-color: ${(props) => props.theme.sale};
  padding: 0.5em 1em;
  font-size: ${(props) => props.theme.fontSizes.large};
  font-weight: 700;
  border: 3px solid ${(props) => props.theme.breadBackground};
  border-right: none;
  border-bottom: none;
`;

const SaleRate = styled.div`
  opacity: 0.9;
  font-weight: 900;
`;

const SaleMiniLabel = styled.div`
  text-transform: uppercase;
  line-height: 1.1;
  opacity: 0.5;
  font-weight: bold;
`;

export default ({ game }: { game: Game }) => (
  <>
    {game.sale ? (
      <SaleRibbon>
        <SaleRate>{game.sale.rate.toFixed()}%</SaleRate>
        <SaleMiniLabel>off</SaleMiniLabel>
      </SaleRibbon>
    ) : null}
  </>
);
