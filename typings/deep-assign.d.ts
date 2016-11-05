
interface DeepAssignStatic {
  (...args: any[]): any
}

declare module 'deep-assign' {
  var da: DeepAssignStatic;
  export = da;
}