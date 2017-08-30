/**
 * Typings for https://github.com/erikras/lru-memoize
 */
declare module "lru-memoize" {
  type Equals = (a: any, b: any) => boolean;

  export default function memoize(
    limit?: number,
    equals?: Equals,
    deepObjects?: boolean
  ): <T>(f: T) => T;
}
