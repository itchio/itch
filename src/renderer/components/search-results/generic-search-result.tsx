import React from "react";
import { findDOMNode } from "react-dom";

import { actions } from "common/actions";
import watching, { Watcher } from "../watching";
import { IAction } from "common/types";

interface IGenericSearchResultProps {
  chosen: boolean;
  active: boolean;
}

@watching
abstract class GenericSearchResult<
  Props extends IGenericSearchResultProps
> extends React.PureComponent<Props> {
  subscribe(watcher: Watcher) {
    watcher.on(actions.commandOk, async (store, action) => {
      if (this.props.chosen && this.props.active) {
        store.dispatch(this.getNavigateAction());
        store.dispatch(actions.closeSearch({}));
      }
    });
  }

  componentDidUpdate() {
    if (this.props.chosen) {
      const node = findDOMNode(this);
      if (node) {
        (node as any).scrollIntoViewIfNeeded();
      }
    }
  }

  abstract getNavigateAction(): IAction<any>;
}

export default GenericSearchResult;
