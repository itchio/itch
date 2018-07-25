import React from "react";
import { RequestCreator, Client } from "butlerd";
import LoadingCircle from "renderer/basics/LoadingCircle";
import ErrorState from "renderer/basics/ErrorState";
import equal from "react-fast-compare";
import { rcall } from "renderer/butlerd/rcall";
import styled from "renderer/styles";

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

const LoadingStateDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px auto;
`;

const butlerCaller = <Params, Result>(method: RequestCreator<Params, Result>) =>
  class extends React.PureComponent<
    ButlerCallerProps<Params, Result>,
    ButlerCallerState<Result>
  > {
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
      this.queueFetch();
    }

    private queueFetch = (additionalParams?: Object) => {
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
          const result = await rcall(method, fullParams);
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
      if (this.props.onResult) {
        this.props.onResult(r);
      }
      this.setState({ result: r, loading: false });
    };

    private setError = (e: any) => {
      this.setState({ error: e, loading: false });
    };

    render() {
      const { error, loading, result } = this.state;
      const { render, errorsHandled, loadingHandled } = this.props;

      if (loading) {
        if (!loadingHandled) {
          return (
            <LoadingStateDiv>
              <LoadingCircle progress={-1} wide />
            </LoadingStateDiv>
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
      if (!equal(prevProps.params, this.props.params)) {
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
