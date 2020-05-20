import { Action, Cave, Game } from "@itchio/valet";
import { BrowserWindow } from "electron";

interface Dimensions {
  width: number;
  height: number;
}

interface CustomOptions {
  singleton?: boolean;
  detached?: boolean;
  dimensions?: Dimensions;
}

export const modals = wireModals({
  pickCave: modal<{ items: Cave[] }, { index: number }>({
    dimensions: { width: 520, height: 380 },
  }),
  pickManifestAction: modal<
    { game: Game; actions: Action[] },
    { index: number }
  >({
    dimensions: { width: 520, height: 380 },
  }),
  preferences: modal<{}, {}>({
    singleton: true,
    detached: true,
    dimensions: { width: 600, height: 600 },
  }),
  install: modal<{ gameId: number; uploadId?: number; buildId?: number }, {}>({
    dimensions: { width: 600, height: 320 },
  }),
  confirmUninstall: modal<{ gameId: number }, {}>({}),
  forceClose: modal<
    {
      game: Game;
      launchId: string;
    },
    {}
  >({}),
  installQueue: modal<
    {
      gameId: number;
      uploadId?: number;
    },
    {}
  >({
    dimensions: { width: 720, height: 400 },
  }),
});

function modal<Params, Result>(
  customizer: CustomOptions
): ModalCreator<Params, Result> {
  // that's a lie, we're tricking the type system
  return customizer as any;
}

export interface ModalCreator<Params, Result> {
  __kind: string;
  __params: Params;
  __result: Result;
  __customOptions: CustomOptions;
}

interface MirrorInput {
  [key: string]: ModalCreator<any, any>;
}

type MirrorOutput<T> = { [key in keyof T]: T[key] };

function wireModals<T extends MirrorInput>(input: T): MirrorOutput<T> {
  const res = {} as any;
  for (const k of Object.keys(input)) {
    let __customOptions = input[k];
    res[k] = {
      __kind: k,
      __customOptions,
    };
  }
  return res as MirrorOutput<T>;
}

export interface ModalsState {
  [id: string]: ModalState;
}

export interface ModalState {
  mc: ModalCreator<any, any>;
  browserWindow: BrowserWindow;
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
