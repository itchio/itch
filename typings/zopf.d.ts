
declare module 'zopf' {
  import {SinonSpy, SinonStub, SinonMock} from "sinon";

  interface ITest {
    /**
     * Asserts that a and b are the same (value comparison via deepEqual).
     * Not to be confused with 'is'
     */
    same<T>(a: T, b: T, label?: string): void;

    /**
     * Asserts that "a is b" (===)
     * Not to be confused with 'same'
     */
    is<T>(a: T, b: T, label?: string): void;

    /**
     * Asserts that x is truthy.
     */
    true(x: any, label?: string): void;

    /**
     * Asserts that x is truthy.
     */
    ok(x: any, label?: string): void;

    /**
     * Asserts that x is falsey.
     */
    false(x: any, label?: string): void;

    /**
     * Asserts that x is falsey.
     */
    notOk(x: any, label?: string): void;

    /**
     * Asserts that the Promise p rejects.
     */
    rejects(p: Promise<any>): void;

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
    samePaths(a: string[], b: string[]): void;
  }

  interface ITestStatic {
    (name: string, cb: (t: ITest) => void): void;

    /**
     * Return an object that would be obtained by requiring a module with a default export
     */
    module<T>(defaultExport: T): T;
  }

  var test: ITestStatic;
  export = test;
}