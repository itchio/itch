
interface Walker {
  on(eventName: string, cb: (...args: any[]) => void): void
}

interface WalkStatic {
  walk(path: string, options: any): Walker
}

declare module 'walk' {
  var walk: WalkStatic;
  export = walk;
}