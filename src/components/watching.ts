import { Watcher } from "../reactors/watcher";
export { Watcher } from "../reactors/watcher";

import * as PropTypes from "prop-types";

/**
 * watching is an ES2017 decorator that lets components subscribe
 * to actions, much like reactors. They have to define a `subscribe`
 * method that will get a watcher as only argument.
 */
export default function(constructor: Function) {
  if (!constructor.prototype.subscribe) {
    throw new Error(
      `Component ${constructor.name} is missing subscribe method (watching decorator)`
    );
  }

  const origContextTypes = (constructor as any).contextTypes || {};
  (constructor as any).contextTypes = {
    ...origContextTypes,
    store: PropTypes.shape({
      subscribe: PropTypes.func.isRequired,
      dispatch: PropTypes.func.isRequired,
      getState: PropTypes.func.isRequired,
    }),
  };

  const originalWillMount = constructor.prototype.componentWillMount;
  constructor.prototype.componentWillMount = function() {
    if (!this.context.store) {
      throw new Error(
        `Can't set up watching because no ` +
          `store in context. Did you forget to wrap your top-level component in <Provider/> ?`
      );
    }

    this.watcher = new Watcher();
    this.context.store.watcher.addSub(this.watcher);
    constructor.prototype.subscribe.call(this, this.watcher);

    if (originalWillMount) {
      originalWillMount.call(this);
    }
  };

  const originalWillUnmount = constructor.prototype.componentWillUnmount;
  constructor.prototype.componentWillUnmount = function() {
    if (!this.context.store) {
      throw new Error(
        `Can't tear down watching because no ` +
          `store in context. Did you forget to wrap your top-level component in <Provider/> ?`
      );
    }

    this.context.store.watcher.removeSub(this.watcher);
    this.watcher = null;

    if (originalWillUnmount) {
      originalWillUnmount.call(this);
    }
  };
}
