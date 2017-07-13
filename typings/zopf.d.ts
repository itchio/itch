declare namespace Zopf {
  import { SinonSpy, SinonStub, SinonMock } from "sinon";

  export interface ITest {
    /**
     * Assert that actual and expected have the same structure and nested values
     * using node's deepEqual() algorithm with strict comparisons (===) on leaf
     * nodes and an optional description of the assertion msg.
     */
    same<T>(actual: T, expected: T, msg?: string): void;

    /**
     * Assert that actual and expected have the same elements, although
     * not necessarily in the same order.
     */
    sameSet<T>(actual: T[], expected: T[], msg?: string): void;

    /**
     * Assert that actual === expected with an optional description of the assertion msg.
     */
    is<T>(actual: T, expected: T, msg?: string): void;

    /**
     * Assert that value is truthy with an optional description of the assertion msg.
     */
    true(x: any, msg?: string): void;

    /**
     * Assert that value is truthy with an optional description of the assertion msg.
     */
    ok(x: any, msg?: string): void;

    /**
     * Assert that value is falsy with an optional description of the assertion msg.
     */
    false(value: any, msg?: string): void;

    /**
     * Assert that value is falsy with an optional description of the assertion msg.
     */
    notOk(value: any, msg?: string): void;

    /**
     * Asserts that the Promise p rejects.
     */
    rejects(promise: Promise<any>): void;

    /**
     * Create a new named testcase.
     */
    case(name: string, cb: (t: ITest) => void): void;

    /**
     * Stub a method of a class for the duration of this test.
     */
    stub(object: any, methodName: string): SinonStub;

    /**
     * Return a Sinon spy for an object's method
     */
    spy(object: any, methodName: string): SinonSpy;

    /**
     * Return a Sinon mock for an object
     */
    mock(object: any): SinonMock;

    /**
     * Assert that a and b contain the same file paths (they're normalized for comparison)
     */
    samePaths(actual: string[], expected: string[]): void;

    /**
     * Print a comment without breaking TAP output
     */
    comment(msg: string): void;
  }

  export interface ITestStatic {
    (name: string, cb: (t: ITest) => void): void;

    /**
     * Return an object that would be obtained by requiring a module with a default export
     */
    module<T>(defaultExport: T): T;
  }
}

declare module "zopf" {
  var test: Zopf.ITestStatic;
  export = test;
}
