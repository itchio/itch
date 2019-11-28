export interface OngoingLaunches {
  [launchId: string]: OngoingLaunch;
}

export type OngoingLaunch =
  | OngoingLaunchPreparing
  | OngoingLaunchRunning
  | OngoingLaunchExiting;

export type OngoingLaunchBase = {
  caveId: string;
  gameId: number;
  uploadId: number;
  buildId?: number;
};

export type OngoingLaunchPreparing = OngoingLaunchBase & {
  stage: "preparing";
};

export type OngoingLaunchRunning = OngoingLaunchBase & {
  stage: "running";
};

export type OngoingLaunchExiting = OngoingLaunchBase & {
  stage: "exiting";
};
