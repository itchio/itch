import { ModalCreator, modals, ModalPayload } from "common/modals";
import React from "react";
import { useSocket } from "renderer/contexts";
import { PickCaveModal } from "renderer/modals/PickCaveModal";
import { queries } from "common/queries";
import { PreferencesModal } from "renderer/modals/PreferencesModal";
import { PickManifestActionModal } from "renderer/modals/PickManifestActionModal";
import { InstallModal } from "renderer/modals/InstallModal";
import { ForceCloseModal } from "renderer/modals/ForceCloseModal";
import { InstallQueueModal } from "renderer/modals/InstallQueueModal";
import { ConfirmUninstallModal } from "renderer/modals/ConfirmUninstallModal";

export interface ModalProps<Params, Result> {
  params: Params;
  onResult: (result: Result) => void;
}

type ModalWidget<Props, Result> = (
  props: ModalProps<Props, Result>
) => JSX.Element | null;

export function modalWidget<Props, Result>(
  _mc: ModalCreator<Props, Result>,
  render: ModalWidget<Props, Result>
): ModalWidget<Props, Result> {
  return render;
}

let modalComponents: {
  [k in keyof typeof modals]: ModalWidget<any, any>;
} = {
  installQueue: InstallQueueModal,
  install: InstallModal,
  forceClose: ForceCloseModal,
  confirmUninstall: ConfirmUninstallModal,
  pickCave: PickCaveModal,
  pickManifestAction: PickManifestActionModal,
  preferences: PreferencesModal,
};

export const ModalRouter = () => {
  let socket = useSocket();

  let payloadString = new URLSearchParams(window.location.search).get(
    "payload"
  );
  if (!payloadString) {
    return <div>Missing modal payload</div>;
  }
  let { id, kind, params } = JSON.parse(payloadString) as ModalPayload;

  let props: ModalProps<any, any> = {
    params,
    onResult: (result: any) => {
      (async () => {
        try {
          // wait for the `modalResult` roundtrip before closing the window
          // to avoid race conditions main-process side
          if (id !== null) {
            await socket.query(queries.modalResult, { id, result });
          }
        } finally {
          window.close();
        }
      })().catch(e => console.warn(e));
    },
  };

  let Component = modalComponents[kind as keyof typeof modals];
  return <Component {...props} />;
};
