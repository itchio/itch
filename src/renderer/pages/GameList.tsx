import { GameRecord } from "common/butlerd/messages";
import React from "react";

interface Props {
  records: GameRecord[];
  setRecords: React.Dispatch<React.SetStateAction<GameRecord[]>>;
}

export const GameList = (props: Props) => {
  return (
    <ul>
      {props.records.map(r => {
        return (
          <li key={r.id}>
            {r.title} - {r.owned ? "Owned" : null} -{" "}
            {r.installedAt ? "Installed" : null}
          </li>
        );
      })}
    </ul>
  );
};
