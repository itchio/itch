
export interface INeed {
    type: string;
    code?: number;
    err?: string;
}

export interface ICaretaker {
    (n: INeed): void;
}

export interface ICaretakerSet {
    [key: string]: ICaretaker;
}

export interface ICheckResult {
    needs: INeed[];
    errors: Error[];
}
