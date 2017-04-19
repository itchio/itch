
import * as React from "react";
import {findDOMNode} from "react-dom";

import * as actions from "../../actions";
import watching, {Watcher} from "../watching";

interface IGenericSearchResultProps {
  chosen: boolean;
  active: boolean;
}

@watching
abstract class GenericSearchResult <Props extends IGenericSearchResultProps, State>
    extends React.Component<Props, State> {
  subscribe (watcher: Watcher) {
    watcher.on(actions.triggerOk, async (store, action) => {
      if (this.props.chosen && this.props.active) {
        store.dispatch(actions.navigate(this.getPath()));
        store.dispatch(actions.closeSearch({}));
      }
    });
  }

  componentDidUpdate() {
    if (this.props.chosen) {
      const node = findDOMNode(this);
      (node as any).scrollIntoViewIfNeeded();
    }
  }
  
  abstract getPath(): string
};

export default GenericSearchResult;
