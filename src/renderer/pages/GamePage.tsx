import React from "react";

export const GamePage = (props: { gameId: number }) => {
  return (
    <div>
      <p>Should show game {props.gameId}</p>
      <p>
        Navigate to <a href="itch://games/5">game 5</a>
      </p>
      <p>
        Navigate to <a href="itch://games/12">game 12</a>
      </p>
    </div>
  );
};
