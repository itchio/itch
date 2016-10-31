
interface DeepFreezeStatic {
    <T>(input: T): T;
}

declare module "deep-freeze" {
    var df: DeepFreezeStatic;
    export = df;
}