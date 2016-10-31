
interface ExtendableError {
  new (message: string): ExtendableError
}

declare module 'es6-error' {
  var ee: ExtendableError;
  export = ee;
}