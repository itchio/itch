import { Cave } from "common/butlerd/messages";

export const modals = wireModals({
  pickCave: modal<{ items: Cave[] }, { index: number }>(),
});

function modal<Params, Result>(): ModalCreator<Params, Result> {
  // that's a lie, we're tricking the type system
  return null as any;
}

export interface ModalCreator<Params, Result> {
  __kind: string;
  __params: Params;
  __result: Result;
}

interface MirrorInput {
  [key: string]: ModalCreator<any, any>;
}

type MirrorOutput<T> = { [key in keyof T]: T[key] };

function wireModals<T extends MirrorInput>(input: T): MirrorOutput<T> {
  const res = {} as any;
  for (const k of Object.keys(input)) {
    res[k] = {
      __kind: k,
    };
  }
  return res as MirrorOutput<T>;
}

export interface ModalsState {
  [id: string]: ModalState;
}

export interface ModalState {
  onResult: (result: any) => void;
}

export interface ModalPayload {
  // BrowserWindow id for this modal
  id: string;
  // Kind for this modal (a keyof the `modals` constant)
  kind: string;
  // Parameters for this modal
  params: any;
}
