import { ModalCreator, modals, ModalPayload } from "common/modals";
import { packets } from "common/packets";
import React from "react";
import { useSocket } from "renderer/contexts";
import { PickCaveModal } from "renderer/modals/PickCaveModal";
import { queries } from "common/queries";
import { PreferencesModal } from "renderer/modals/PreferencesModal";
import { PickManifestActionModal } from "renderer/modals/PickManifestActionModal";
import { InstallModal } from "renderer/modals/InstallModal";

export interface ModalProps<Params, Result> {
  params: Params;
  onResult: (result: Result) => void;
}

type ModalWidget<P, R> = (props: ModalProps<P, R>) => JSX.Element | null;

export function modalWidget<P, R>(
  mc: ModalCreator<P, R>,
  render: ModalWidget<P, R>
): ModalWidget<P, R> {
  return render;
}

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
        // not sure why this is needed tbh, we already check for
        // id's nonnullness above.
        try {
          if (id !== null) {
            await socket.query(queries.modalResult, { id, result });
          }
        } finally {
          window.close();
        }
      })().catch(e => console.warn(e));
    },
  };

  switch (kind) {
    case modals.pickCave.__kind:
      return <PickCaveModal {...props} />;
    case modals.pickManifestAction.__kind:
      return <PickManifestActionModal {...props} />;
    case modals.preferences.__kind:
      return <PreferencesModal {...props} />;
    case modals.install.__kind:
      return <InstallModal {...props} />;
    default:
      return <div></div>;
  }
};
