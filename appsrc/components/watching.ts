
// tslint:disable:no-console

import {Watcher} from "../reactors/watcher";
export {Watcher} from "../reactors/watcher";

import store from "../store/chrome-store";

/**
 * watching is an ES2017 decorator that lets components subscribe
 * to actions, much like reactors. They have to define a `subscribe`
 * method that will get a watcher as only argument.
 */
export default function (constructor: Function) {
    if (!constructor.prototype.subscribe) {
        throw new Error(`Component ${constructor.name} is missing subscribe method (watching decorator)`);
    }

    const originalWillMount = constructor.prototype.componentWillMount;
    constructor.prototype.componentWillMount = function () {
        this.watcher = new Watcher();
        store.watcher.addSub(this.watcher);
        constructor.prototype.subscribe.apply(this, [this.watcher]);

        if (originalWillMount) {
            originalWillMount.apply(this);
        }
    };

    const originalWillUnmount = constructor.prototype.componentWillUnmount;
    constructor.prototype.componentWillUnmount = function () {
        store.watcher.removeSub(this.watcher);
        this.watcher = null;

        if (originalWillUnmount) {
            originalWillUnmount.apply(this);
        }
    };
};
