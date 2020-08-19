import { Watcher } from "common/util/watcher";
export { Watcher } from "common/util/watcher";

import { rendererLogger } from "renderer/logger";
import { ReactReduxContext } from "react-redux";
import React from "react";

/**
 * watching is an ES2017 decorator that lets components subscribe
 * to actions, much like reactors. They have to define a `subscribe`
 * method that will get a watcher as only argument.
 */
export default function <C extends React.ComponentType<P>, P>(
  constructor: C
): C {
  if (!constructor.prototype.subscribe) {
    throw new Error(
      `Component ${constructor.name} is missing subscribe method (watching decorator)`
    );
  }

  const originalDidMount = constructor.prototype.componentDidMount;
  constructor.prototype.componentDidMount = function () {
    if (!this.props.__store) {
      throw new Error(
        `Can't set up watching because no ` +
          `__store in props. Did you forget to wrap your top-level component in <Provider/> ?`
      );
    }

    this.watcher = new Watcher(rendererLogger);
    this.props.__store.watcher.addSub(this.watcher);
    constructor.prototype.subscribe.call(this, this.watcher);

    if (originalDidMount) {
      originalDidMount.call(this);
    }
  };

  const originalWillUnmount = constructor.prototype.componentWillUnmount;
  constructor.prototype.componentWillUnmount = function () {
    if (!this.props.__store) {
      throw new Error(
        `Can't tear down watching because no ` +
          `__store in props. Did you forget to wrap your top-level component in <Provider/> ?`
      );
    }

    this.props.__store.watcher.removeSub(this.watcher);
    this.watcher = null;

    if (originalWillUnmount) {
      originalWillUnmount.call(this);
    }
  };

  let Patched = (constructor as unknown) as React.ComponentType<any>;
  return (class extends React.PureComponent<P> {
    render() {
      return (
        <ReactReduxContext.Consumer>
          {({ store }) => <Patched {...this.props} __store={store} />}
        </ReactReduxContext.Consumer>
      );
    }
  } as any) as C;
}
