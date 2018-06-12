import React from "react";
import { IRequestCreator, Client } from "butlerd";
import { withButlerClient } from "common/butlerd";
import rootLogger from "common/logger";
import LoadingState from "../loading-state";
import ErrorState from "./error-state";
const logger = rootLogger.child({ name: "ButlerCall" });

interface ButlerCallProps<Params, Result> {
  params: Params;
  render: (value: Result) => JSX.Element;
  renderLoading?: () => JSX.Element;
  renderError?: (error: Error) => JSX.Element;
}

interface ButlerCallState<Result> {
  loading: boolean;
  error: Error;
  result: Result;
}

// aaaaaaand now it's a function!
const ButlerCall = <Params, Result>(method: IRequestCreator<Params, Result>) =>
  class extends React.PureComponent<
    ButlerCallProps<Params, Result>,
    ButlerCallState<Result>
  > {
    client: Client | null;
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
      this.promise = new Promise((resolve, reject) => {
        this.resolve = resolve;
      });
    }

    componentDidMount() {
      withButlerClient(logger, async client => {
        this.client = client;
        this.queueFetch();
        await this.promise;
      }).catch(this.setError);
    }

    private queueFetch = () => {
      this.client
        .call(method, this.props.params)
        .then(this.setResult)
        .catch(this.setError);
    };

    private setResult = (r: Result) => {
      console.log(r);
      this.setState({ result: r, loading: false });
    };

    private setError = (e: any) => {
      console.error(e);
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
      const { render, renderLoading, renderError } = this.props;

      if (loading) {
        if (renderLoading) {
          return renderLoading();
        }
        return <LoadingState />;
      }

      if (error) {
        if (renderError) {
          return renderError(error);
        }
        return <ErrorState error={error} />;
      }

      return render(result);
    }
  };

export default ButlerCall;
