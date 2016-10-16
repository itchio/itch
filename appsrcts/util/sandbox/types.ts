
export interface Need {
    type: string
    code?: number
    err?: string
}

export interface Caretaker {
    (n: Need): void
}

export interface CaretakerSet {
    [key: string]: Caretaker
}

export interface CheckResult {
    needs: Array<Need>
    errors: Array<Error>
}
