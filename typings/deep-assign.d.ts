
interface DeepAssignStatic {
  (...any): any
}

declare module 'deep-assign' {
  var da: DeepAssignStatic;
  export = da;
}