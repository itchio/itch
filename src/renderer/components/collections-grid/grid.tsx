import React from "react";
import { isEmpty } from "underscore";
import * as messages from "common/butlerd/messages";

import EmptyState from "../empty-state";
import { withTab } from "../meats/tab-provider";
import ButlerCall from "../butler-call/butler-call";
import { withProfileId } from "../profile-provider";
import { withDispatch, Dispatch } from "../dispatch-provider";
import { actions } from "common/actions";

const FetchProfileCollections = ButlerCall(messages.FetchProfileCollections);

class Grid extends React.PureComponent<Props> {
  render() {
    const { profileId } = this.props;

    return (
      <FetchProfileCollections
        params={{ profileId }}
        render={({ items }) => {
          if (isEmpty(items)) {
            return (
              <EmptyState
                icon="tag"
                bigText={["collections.empty"]}
                smallText={["collections.empty_sub"]}
                buttonIcon="earth"
                buttonText={["status.downloads.find_games_button"]}
                buttonAction={() =>
                  this.props.dispatch(
                    actions.navigate({
                      window: "root",
                      url: "itch://featured",
                    })
                  )
                }
              />
            );
          }

          return (
            <>
              {items.map(coll => (
                <div key={coll.id}>
                  <a href={`itch://collections/${coll.id}`}>
                    <h2>{coll.title}</h2>
                  </a>
                  <p>{coll.gamesCount} games</p>
                </div>
              ))}
            </>
          );
        }}
      />
    );
  }
}

interface Props {
  tab: string;
  profileId: number;
  dispatch: Dispatch;
}

export default withProfileId(withTab(withDispatch(Grid)));
