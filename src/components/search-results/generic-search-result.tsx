
import * as React from "react";
import {findDOMNode} from "react-dom";

import * as actions from "../../actions";
import watching, {Watcher} from "../watching";

import * as styles from "../styles";
import {css} from "../styles";

export const searchResultStyle = css`
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  padding: 4px;
  margin: 8px 0;

  border-radius: 2px;
  transition: all 0.2s;

  .title-block {
    overflow-x: hidden;
    margin: .5em;
  }

  h4 {
    ${styles.singleLine()}
    text-shadow: 0 0 2px ${props => props.theme.inputTextShadow};
    overflow: hidden;
    text-overflow: ellipsis;
  }

  h4, .platforms {
    padding: .4em 0;
  }

  &:hover, &.chosen {
    background: ${props => props.theme.sidebarEntryFocusedBackground};
    cursor: pointer;
  }

  img {
    ${styles.thumbnailStyle()}
    ${styles.defaultCoverBackground()}
    flex-shrink: 0;
    margin-left: .5em;
    width: ${80 * 0.8}px;
    height: ${67.6 * 0.8}px;
  }

  .spacer {
    flex-grow: 100;
  }

  .icon-button {
    @include secondary-link;
    margin-right: .5em;

    &:hover {
      opacity: .7;
      cursor: pointer;
    }
  }

  &.not-platform-compatible {
    opacity: .4;
  }
`;

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
