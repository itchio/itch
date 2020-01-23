import { modalWidget } from "renderer/modals/ModalRouter";
import { modals } from "common/modals";
import { HardModal } from "renderer/modals/HardModal";
import React from "react";

export const PreferencesModal = modalWidget(modals.preferences, props => {
  return (
    <HardModal title="Preferences" content={<p>Some preferences yeah?</p>} />
  );
});
