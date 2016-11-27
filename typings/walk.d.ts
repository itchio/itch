
interface Walker {
  on(eventName: string, cb: (...args: any[]) => void): void
}

interface WalkStatic {
  walk(path: string, options: any): Walker
}

/**
 * Typings for https://github.com/coolaj86/node-walk
 */
declare module 'walk' {
  var walk: WalkStatic;
  export = walk;
}