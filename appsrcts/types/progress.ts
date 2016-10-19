
export interface IProgressInfo {
    /** progress of the task between [0,1] */
    progress: number;

    /** current bytes per second */
    bps: number;

    /** estimated time remaining, in seconds */
    eta: number;
}

export interface IProgressListener {
    (info: IProgressInfo): void;
}
