
declare module "nedb" {
    class Datastore {
        constructor(opts: any);
        loadDatabase(cb: (err: Error) => void): void;
        find(query: any, cb: (err: Error, res: any) => void): void;
    }

    export default Datastore;
}