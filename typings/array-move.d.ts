/**
 * Typings for https://github.com/sindresorhus/array-move/blob/master/index.js
 */
declare module "array-move" {
  declare function arrayMove<T>(input: T[], oldIndex: number, newIndex: number);
  export = arrayMove;
}
