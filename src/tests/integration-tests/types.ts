
import {Application} from "spectron";
import "zopf";

export const DefaultTimeout = 15000;

export interface ISpecOpts {
  args?: string[];
  wipePrefix?: boolean;
  ownExit?: boolean;
}

export interface ISpec {
  (name: string, cb: (t: IIntegrationTest) => Promise<void>, opts?: ISpecOpts): void;
}

interface ITestAdditions {
  app: Application;

  safeClick: (selector: string) => Promise<void>;

  /** used by test runner, don't mess with from tests */
  itch: {
    polling: boolean;
    exitCode: number;
    pollPromise: Promise<void>;
  };
}

export type IIntegrationTest = Zopf.ITest & ITestAdditions;

export const testAccountName = "itch-test-account";
export const testAccountPassword = process.env.ITCH_TEST_ACCOUNT_PASSWORD;

export const sleep = (ms) => new Promise((resolve, reject) => setTimeout(resolve, ms));
