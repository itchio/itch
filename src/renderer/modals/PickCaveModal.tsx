import React from "react";
import { modalWidget } from "renderer/modals/ModalRouter";
import { modals } from "common/modals";
import { formatUploadTitle } from "renderer/basics/upload";

export const PickCaveModal = modalWidget(modals.pickCave, props => {
  const { params, onResult } = props;
  return (
    <div>
      <p>Pick your fighter</p>
      <ul>
        {params.items.map((cave, index) => {
          return (
            <li key={cave.id} onClick={() => onResult({ index })}>
              {formatUploadTitle(cave.upload)}
            </li>
          );
        })}
      </ul>
    </div>
  );
});
