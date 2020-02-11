import { modalWidget } from "renderer/modals/ModalRouter";
import { modals } from "common/modals";
import { HardModal } from "renderer/modals/HardModal";
import React from "react";

export const InstallQueueModal = modalWidget(modals.installQueue, props => {
  return (
    <HardModal content={<p>Oh we should install something for sure.</p>} />
  );
});
