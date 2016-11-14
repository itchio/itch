
declare module 'zopf' {
  interface ITest {
    /**
     * Asserts that a and b are the same (value comparison via deepEqual, not ===)
     */
    same<T>(a: T, b: T): void;

    /**
     * Create a new named testcase
     */
    case(name: string, cb: (t: ITest) => void): void;
  }

  function test (name: string, cb: (t: ITest) => void): void;
  export = test;
}