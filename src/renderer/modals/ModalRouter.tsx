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
import styled from "styled-components";

const OuterDiv = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
`;

const InnerDiv = styled.div`
  width: 100%;
  max-height: 100%;
  overflow: hidden;

  display: flex;
  justify-content: stretch;
  align-items: stretch;
`;

export interface ModalProps<Params, Result> {
  params: Params;
  // sizeRef: Ref<any>;
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
  const socket = useSocket();
  // const timeout = useRef<NodeJS.Timeout | undefined>();

  let payloadString = new URLSearchParams(window.location.search).get(
    "payload"
  );
  let { id, kind, params } = JSON.parse(payloadString || "{}") as ModalPayload;

  // let initialHeight = window.outerHeight;
  // const ref = useResizeObserver({
  //   onResize: useCallback(
  //     (_width, height) => {
  //       if (timeout.current) {
  //         clearTimeout(timeout.current);
  //       }
  //       timeout.current = setTimeout(() => {
  //         let paddingHeight = window.outerHeight - window.innerHeight;
  //         height += paddingHeight;
  //         if (height > initialHeight) {
  //           height = initialHeight;
  //         }

  //         let width = window.outerWidth;
  //         if (width != window.outerWidth || height != window.outerHeight) {
  //           window.resizeTo(width, height);
  //         }
  //         socket
  //           .query(queries.modalDidLayout, { id, width, height })
  //           .catch(e => {
  //             console.warn(`could not send modalDidLayout`, e.stack);
  //           });
  //       }, 150);
  //     },
  //     [id, initialHeight, socket]
  //   ),
  // });

  if (!payloadString) {
    return <div>Missing modal payload</div>;
  }

  let props: ModalProps<any, any> = {
    params,
    // sizeRef: ref,
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
  return (
    <OuterDiv>
      <InnerDiv>
        <Component {...props} />
      </InnerDiv>
    </OuterDiv>
  );
};
