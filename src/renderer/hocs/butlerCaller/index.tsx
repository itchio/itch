import React from "react";
import { IRequestCreator, Client } from "butlerd";
import { withButlerClient } from "common/butlerd";
import rootLogger, { Logger } from "common/logger";
import * as lodash from "lodash";
import LoadingCircle from "renderer/basics/LoadingCircle";
import ErrorState from "renderer/basics/ErrorState";

interface ButlerCallerProps<Params, Result> {
  params: Params;
  render: (args: ButlerCallerArgs<Params, Result>) => JSX.Element;
  errorsHandled?: boolean;
  loadingHandled?: boolean;
  sequence?: number;
  onResult?: (res: Result) => void;
}

interface StaleResult {
  stale?: boolean;
}

interface ButlerCallerState<Result> {
  loading: boolean;
  error: Error;
  result: Result;
}

type RefreshFunc = () => void;

interface ButlerCallerArgs<Params, Result> {
  loading: boolean;
  error: Error;
  result: Result;
  refresh: RefreshFunc;
}

let markSeed = 0;

const butlerCaller = <Params, Result>(
  method: IRequestCreator<Params, Result>
) =>
  class extends React.PureComponent<
    ButlerCallerProps<Params, Result>,
    ButlerCallerState<Result>
  > {
    clientPromise: Promise<Client>;
    resolveClient: (client: Client) => void;
    promise: Promise<void>;
    resolve: () => void;
    logger: Logger;

    static displayName = `ButlerCall(${method.name})`;

    constructor(props: any, context: any) {
      super(props, context);
      this.state = {
        loading: true,
        error: undefined,
        result: undefined,
      };
      this.logger = rootLogger.child({
        name: `butlerd/${getRequestName(method)}`,
      });
    }

    componentDidMount() {
      this.promise = new Promise((resolve, reject) => {
        this.resolve = resolve;
      });
      this.clientPromise = new Promise((resolve, reject) => {
        withButlerClient(this.logger, async client => {
          resolve(client);
          await this.promise;
        }).catch(e => {
          reject(e);
          this.setError(e);
        });
      });
      this.queueFetch();
    }

    private queueFetch = (additionalParams?: Object) => {
      markSeed++;
      let markPrefix = `butlerd-${markSeed}`;
      let startMark = `${markPrefix}-start`;
      let endMark = `${markPrefix}-end`;
      let measureName = `⌘ ${getRequestName(method)}`;

      // cf. https://github.com/Microsoft/TypeScript/pull/13288
      let fullParams = this.props.params as any;
      if (additionalParams) {
        fullParams = { ...fullParams, ...additionalParams };
      }

      this.setState({
        loading: true,
      });

      (async () => {
        try {
          performance.mark(startMark);
          const client = await this.clientPromise;
          const result = await client.call(method, fullParams);
          performance.mark(endMark);
          performance.measure(`${measureName}`, startMark, endMark);

          this.setResult(result);
          if (!fullParams.fresh && (result as StaleResult).stale) {
            this.queueFetch({ fresh: true });
          }
        } catch (error) {
          this.setError(error);
        }
      })();
    };

    private setResult = (r: Result) => {
      console.log(getRequestName(method), `→ `, r);
      if (this.props.onResult) {
        this.props.onResult(r);
      }
      this.setState({ result: r, loading: false });
    };

    private setError = (e: any) => {
      this.setState({ error: e, loading: false });
    };

    componentWillUnmount() {
      if (this.resolve) {
        this.resolve();
        return;
      }
    }

    render() {
      const { error, loading, result } = this.state;
      const { render, errorsHandled, loadingHandled } = this.props;

      if (loading) {
        if (!loadingHandled) {
          return (
            <div
              style={{
                margin: "20px auto",
                width: "100%",
                textAlign: "center",
              }}
            >
              <LoadingCircle progress={-1} wide />
            </div>
          );
        }
      }

      if (error) {
        if (!errorsHandled) {
          return <ErrorState error={error} />;
        }
      }

      return render({ error, loading, result, refresh: this.queueFetch });
    }

    componentDidUpdate(prevProps: ButlerCallerProps<Params, Result>) {
      if (!lodash.isEqual(prevProps.params, this.props.params)) {
        this.queueFetch();
        return;
      }

      if (prevProps.sequence != this.props.sequence) {
        this.queueFetch({ fresh: true });
        return;
      }
    }
  };

export default butlerCaller;

const fakeClient = {
  generateID: () => 0,
} as Client;

const requestNameMap = new WeakMap<IRequestCreator<any, any>, string>();

function getRequestName(rc: IRequestCreator<any, any>): string {
  if (!requestNameMap.has(rc)) {
    const name = rc({} as any)(fakeClient).method;
    requestNameMap.set(rc, name);
  }
  return requestNameMap.get(rc);
}
