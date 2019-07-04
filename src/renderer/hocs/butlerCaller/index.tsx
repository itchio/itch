import { RequestCreator } from "butlerd";
import { devNull, Logger } from "common/logger";
import { Watcher } from "common/util/watcher";
import React from "react";
import equal from "react-fast-compare";
import ErrorState from "renderer/basics/ErrorState";
import Floater from "renderer/basics/Floater";
import { ActionList, invalidators } from "renderer/butlerd/invalidators";
import { rcall } from "renderer/butlerd/rcall";
import styled from "renderer/styles";
import { debounce } from "underscore";
import { ReactReduxContext } from "react-redux";

interface GenericProps<Params, Result> {
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

interface GenericState<Result> {
  loading: boolean;
  error: Error;
  result: Result;
}

interface ButlerCallerArgs<Params, Result> {
  loading: boolean;
  error: Error;
  result: Result;
}

export function renderNoop(): JSX.Element {
  return null;
}

export const LoadingStateDiv = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px auto;
`;

const butlerCaller = <Params, Result>(
  method: RequestCreator<Params, Result>
) => {
  type Props = GenericProps<Params, Result>;
  type State = GenericState<Result>;

  type CallerProps = Props & { __store?: { watcher: Watcher } };

  class Caller extends React.PureComponent<CallerProps, State> {
    static displayName = `ButlerCall(${method.name})`;
    fetchID = 0;
    invalidators: ActionList;
    watcher: Watcher;

    constructor(props: Props, context: any) {
      super(props, context);
      this.state = {
        loading: true,
        error: undefined,
        result: undefined,
      };
      this.invalidators = invalidators.get(method);
    }

    componentDidMount() {
      this.queueFetch();
      if (this.invalidators) {
        this.watcher = new Watcher(new Logger(devNull));
        this.props.__store.watcher.addSub(this.watcher);
        for (const invalidatingAction of this.invalidators) {
          this.watcher.on(invalidatingAction, async (store, action) => {
            this.invalidate();
          });
        }
      }
    }

    componentWillUnmount() {
      if (this.watcher) {
        this.props.__store.watcher.removeSub(this.watcher);
      }
    }

    invalidate = debounce(() => {
      this.queueFetch();
    }, 150);

    private queueFetch = (additionalParams?: Object) => {
      // cf. https://github.com/Microsoft/TypeScript/pull/13288
      let fullParams = this.props.params as any;
      if (additionalParams) {
        fullParams = { ...fullParams, ...additionalParams };
      }

      this.setState({
        loading: true,
      });

      this.fetchID++;
      let { fetchID } = this;

      (async () => {
        try {
          const result = await rcall(method, fullParams);
          if (this.fetchID !== fetchID) {
            // discard outdated result
            return;
          }

          this.setResult(result);
          if (!fullParams.fresh && (result as StaleResult).stale) {
            this.queueFetch({ fresh: true });
          }
        } catch (error) {
          if (this.fetchID !== fetchID) {
            // discard outdated result
            return;
          }
          this.setError(error);
        }
      })();
    };

    private setResult = (r: Result) => {
      if (this.props.onResult) {
        this.props.onResult(r);
      }
      this.setState({ result: r, error: null, loading: false });
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
              <Floater />
            </LoadingStateDiv>
          );
        }
      }

      if (error) {
        if (!errorsHandled) {
          return <ErrorState error={error} />;
        }
      }

      return render({ error, loading, result });
    }

    componentDidUpdate(prevProps: GenericProps<Params, Result>) {
      if (!equal(prevProps.params, this.props.params)) {
        this.queueFetch();
        return;
      }

      if (prevProps.sequence != this.props.sequence) {
        this.queueFetch({ fresh: true });
        return;
      }
    }
  }

  class Wrapper extends React.PureComponent<Props, State> {
    render() {
      return (
        <ReactReduxContext.Consumer>
          {({ store }) => <Caller {...this.props} __store={store as any} />}
        </ReactReduxContext.Consumer>
      );
    }

    static renderCallback(
      f: (args: ButlerCallerArgs<Params, Result>) => JSX.Element
    ) {
      return f;
    }

    static onResultCallback(f: (result: Result) => void) {
      return f;
    }
  }

  return Wrapper;
};

export default butlerCaller;
