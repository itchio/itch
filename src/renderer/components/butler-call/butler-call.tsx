import React from "react";
import { IRequestCreator, Client } from "butlerd";
import { withButlerClient } from "common/butlerd";
import rootLogger from "common/logger";
import LoadingState from "../loading-state";
import ErrorState from "./error-state";
import * as lodash from "lodash";
const logger = rootLogger.child({ name: "ButlerCall" });

interface ButlerCallProps<Params, Result> {
  params: Params;
  render: (args: ButlerCallArgs<Params, Result>) => JSX.Element;
  errorsHandled?: boolean;
  loadingHandled?: boolean;
  sequence?: number;
}

interface ButlerCallState<Result> {
  loading: boolean;
  error: Error;
  result: Result;
}

type RefreshFunc = () => void;

interface ButlerCallArgs<Params, Result> {
  loading: boolean;
  error: Error;
  result: Result;
  refresh: RefreshFunc;
}

const ButlerCall = <Params, Result>(method: IRequestCreator<Params, Result>) =>
  class extends React.PureComponent<
    ButlerCallProps<Params, Result>,
    ButlerCallState<Result>
  > {
    clientPromise: Promise<Client>;
    resolveClient: (client: Client) => void;
    promise: Promise<void>;
    resolve: () => void;

    static displayName = `ButlerCall(${method.name})`;

    constructor(props: any, context: any) {
      super(props, context);
      this.state = {
        loading: true,
        error: undefined,
        result: undefined,
      };
    }

    componentDidMount() {
      this.promise = new Promise((resolve, reject) => {
        this.resolve = resolve;
      });
      this.clientPromise = new Promise((resolve, reject) => {
        withButlerClient(logger, async client => {
          resolve(client);
          await this.promise;
        }).catch(e => {
          reject(e);
          this.setError(e);
        });
      });
      this.queueFetch();
    }

    private queueFetch = () => {
      this.setState({
        loading: true,
      });
      this.clientPromise.then(client => {
        client
          .call(method, this.props.params)
          .then(this.setResult)
          .catch(this.setError);
      });
    };

    private setResult = (r: Result) => {
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
          return <LoadingState />;
        }
      }

      if (error) {
        if (!errorsHandled) {
          return <ErrorState error={error} />;
        }
      }

      return render({ error, loading, result, refresh: this.queueFetch });
    }

    componentDidUpdate(prevProps: ButlerCallProps<Params, Result>) {
      if (
        prevProps.sequence != this.props.sequence ||
        !lodash.isEqual(prevProps.params, this.props.params)
      ) {
        this.queueFetch();
      }
    }
  };

export default ButlerCall;
