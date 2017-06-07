
import {Application} from "spectron";
import {Zopf} from "zopf";

export interface ISpecOpts {
  args?: string[];
}

export interface ISpec {
  (name: string, cb: (t: IIntegrationTest) => Promise<void>, opts?: ISpecOpts): void;
}

interface ITestAdditions {
  ownExit: boolean;
  app: Application;
}

export type IIntegrationTest = Zopf.ITest & ITestAdditions;
