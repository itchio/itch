import * as React from "react";
import { findDOMNode } from "react-dom";

import { actions } from "../../actions";
import watching, { Watcher } from "../watching";
import { IAction } from "../../types/index";

interface IGenericSearchResultProps {
  chosen: boolean;
  active: boolean;
}

@watching
abstract class GenericSearchResult<
  Props extends IGenericSearchResultProps
> extends React.PureComponent<Props> {
  subscribe(watcher: Watcher) {
    watcher.on(actions.trigger, async (store, action) => {
      if (action.payload.command === "ok") {
        if (this.props.chosen && this.props.active) {
          store.dispatch(this.getNavigateAction());
          store.dispatch(actions.closeSearch({}));
        }
      }
    });
  }

  componentDidUpdate() {
    if (this.props.chosen) {
      const node = findDOMNode(this);
      (node as any).scrollIntoViewIfNeeded();
    }
  }

  abstract getNavigateAction(): IAction<any>;
}

export default GenericSearchResult;
