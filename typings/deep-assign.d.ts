
interface DeepAssignStatic {
  (...args: Array<any>): any
}

declare module 'deep-assign' {
  var da: DeepAssignStatic;
  export = da;
}