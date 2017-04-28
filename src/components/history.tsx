
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createStructuredSelector} from "reselect";
import * as invariant from "invariant";

import {map} from "underscore";

import TimeAgo from "./basics/time-ago";

import * as actions from "../actions";

import {IAppState, IHistoryItem, IHistoryItemOption} from "../types";
import {IDispatch} from "../constants/action-types";

class History extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, pickOption, items} = this.props;

    return <ul className="history-page">
    {map(items, (item) => {
      const {label, date, id, options = []} = item;
      return <li key={id} className="history-item">
        <div className="item-description">
          {t.format(label)}
          <div className="timeago">
            <TimeAgo date={date}/>
          </div>
        </div>
        <div className="item-options">
          {map(options, (option) => {
            return <div className="item-option" onClick={(e) => pickOption(id, option)}>
              {t.format(option.label)}
            </div>;
          })}
        </div>
      </li>;
    })}
    </ul>;
  }
}

interface IProps {}

interface IDerivedProps {
  items: IHistoryItem[];

  pickOption: (itemId: string, option: IHistoryItemOption) => void;
}

export default connect<IProps>(History, {
  state: createStructuredSelector({
    items: (state: IAppState) => state.history.itemsByDate,
  }),
  dispatch: (dispatch: IDispatch) => ({
    pickOption: (itemId: string, option: IHistoryItemOption) => {
      invariant(itemId, "have item id");
      if (option.action) {
        dispatch(option.action);
      }
      dispatch(actions.dismissHistoryItem({ id: itemId }));
    },
  }),
});
