
let seed = 0;

import * as PropTypes from "prop-types";
import {IStore} from "../types";
import {IQueryTable} from "../chrome-reactors/querier";

import * as actions from "../actions";

export interface IQueryFunc {
  (props: any): IQueryTable;
}

interface IWrappedComponent {
  __load_id: number;
  props: any;
  context: {
    store: IStore;
  };
}

export default function (loadSpecs: IQueryFunc = () => ({})) {
  return (constructor: any) => {
    const origContextTypes = constructor.contextTypes || {};
    constructor.contextTypes = {
        ...origContextTypes,
        store: PropTypes.shape({
            subscribe: PropTypes.func.isRequired,
            dispatch: PropTypes.func.isRequired,
            getState: PropTypes.func.isRequired,
        }),
    };

    let originalDidMount = constructor.prototype.componentDidMount;
    constructor.prototype.componentDidMount = function (this: IWrappedComponent) {
      if (!this.context.store) {
          throw new Error(`Can't set up watching because no `
          + `store in context. Did you forget to wrap your top-level component in <Provider/> ?`);
      }

      if (originalDidMount) {
        originalDidMount.call(this);
      }

      if (!this.__load_id) {
        this.__load_id = seed++;
      }

      // console.log(`hey it mounted!`);
      const specs = loadSpecs(this.props);
      console.log(`${this.__load_id} specs: ${JSON.stringify(specs)}`);
      this.context.store.dispatch(actions.registerQuery({
        loadId: this.__load_id,
        query: specs,
      }));
    };

    let originalWillUnmount = constructor.prototype.componentWillUnmount;
    constructor.prototype.componentWillUnmount = function (this: IWrappedComponent) {
      if (originalWillUnmount) {
        originalWillUnmount.call(this);
      }

      console.log(`${this.__load_id} unmounting`);
      this.context.store.dispatch(actions.liberateQuery({
        loadId: this.__load_id,
      }));
    };
  };
}
