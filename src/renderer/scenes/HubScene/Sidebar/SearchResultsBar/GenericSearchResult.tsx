import { actions } from "common/actions";
import { Action } from "common/types";
import React from "react";
import { findDOMNode } from "react-dom";
import watching, { Watcher } from "renderer/hocs/watching";

interface GenericSearchResultProps {
  chosen: boolean;
  active: boolean;
  loading: boolean;
}

@watching
abstract class GenericSearchResult<
  Props extends GenericSearchResultProps
> extends React.PureComponent<Props> {
  subscribe(watcher: Watcher) {
    watcher.on(actions.commandOk, async (store, action) => {
      if (this.props.chosen && this.props.active && !this.props.loading) {
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

  abstract getNavigateAction(): Action<any>;
}

export default GenericSearchResult;
