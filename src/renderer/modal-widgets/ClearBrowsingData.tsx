import classNames from "classnames";
import { fileSize } from "common/format/filesize";
import {
  ClearBrowsingDataParams,
  ClearBrowsingDataResponse,
} from "common/modals/types";
import { partitionForUser } from "common/util/partition-for-user";
import electron from "electron";
import React from "react";
import LoadingCircle from "renderer/basics/LoadingCircle";
import { hook } from "renderer/hocs/hook";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { T } from "renderer/t";
import { ModalWidgetProps } from "common/modals";

class ClearBrowsingData extends React.PureComponent<Props, State> {
  constructor(props: ClearBrowsingData["props"], context: any) {
    super(props, context);
    this.state = {
      fetchedCacheSize: false,
      clearCache: true,
      clearCookies: false,
    };
    this.doUpdatePayload(this.state);
  }

  componentDidMount() {
    const { userId } = this.props;

    // FIXME: surely we can do that without remote ?
    // more surely: that surely should just be done in metal
    // and we should read from store or something
    const ourSession = electron.remote.session.fromPartition(
      partitionForUser(String(userId)),
      { cache: true }
    );

    ourSession.getCacheSize().then((cacheSize) => {
      this.setState({
        fetchedCacheSize: true,
        cacheSize,
      });
    });
  }

  change(state: Partial<State>) {
    const mergedState: State = {
      ...this.state,
      ...state,
    };

    this.setState(mergedState);
    this.doUpdatePayload(mergedState);
  }

  doUpdatePayload(state: State) {
    const payloadUpdate = {
      cache: state.clearCache,
      cookies: state.clearCookies,
    };
    this.props.updatePayload(payloadUpdate);
  }

  toggleCache = () => {
    this.change({ clearCache: !this.state.clearCache });
  };

  toggleCookies = () => {
    this.change({ clearCookies: !this.state.clearCookies });
  };

  render() {
    const {
      fetchedCacheSize,
      cacheSize,
      clearCache,
      clearCookies,
    } = this.state;

    // chrome sometimes return negative values (-2 B)
    const shownCacheSize = cacheSize < 0 ? 0 : cacheSize;

    return (
      <ModalWidgetDiv>
        <ClearBrowsingDataList>
          <label className={classNames({ active: clearCache })}>
            <div className="checkbox">
              <input
                type="checkbox"
                id="clear-cache-checkbox"
                checked={clearCache}
                onChange={this.toggleCache}
              />
              {T(["prompt.clear_browsing_data.category.cache"])}
            </div>
            <div className="checkbox-info">
              {fetchedCacheSize ? (
                T([
                  "prompt.clear_browsing_data.cache_size_used",
                  {
                    size: fileSize(shownCacheSize),
                  },
                ])
              ) : (
                <span>
                  <LoadingCircle progress={0.1} />{" "}
                  {T(["prompt.clear_browsing_data.retrieving_cache_size"])},
                </span>
              )}
            </div>
          </label>
          <label className={classNames({ active: clearCookies })}>
            <div className="checkbox">
              <input
                type="checkbox"
                id="clear-cookies-checkbox"
                checked={clearCookies}
                onChange={this.toggleCookies}
              />
              {T(["prompt.clear_browsing_data.category.cookies"])}
            </div>
            <div className="checkbox-info">
              {T(["prompt.clear_browsing_data.cookies_info"])}
            </div>
          </label>
        </ClearBrowsingDataList>
      </ModalWidgetDiv>
    );
  }
}

const ClearBrowsingDataList = styled.div`
  label {
    display: block;
    border-left: 3px solid ${(props) => props.theme.prefBorder};
    padding: 5px 0;
    padding-left: 5px;
    margin: 3px 0;
    margin-bottom: 10px;
    transition: 0.2s border ease-in-out;

    &:hover {
      cursor: pointer;
    }

    &.active {
      border-color: ${(props) => props.theme.accent};
    }
  }

  .checkbox {
    margin: 0;
    display: flex;
    align-items: center;

    input[type="checkbox"] {
      margin-right: 10px;
    }
  }

  .checkbox-info {
    margin: 0;
    margin-top: 5px;
    margin-left: 5px;
    font-size: 90%;
    color: ${(props) => props.theme.secondaryText};
  }
`;

// props

interface Props
  extends ModalWidgetProps<ClearBrowsingDataParams, ClearBrowsingDataResponse> {
  userId: number;
}

interface State {
  fetchedCacheSize?: boolean;
  cacheSize?: number;

  clearCache?: boolean;
  clearCookies?: boolean;
}

export default hook((map) => ({
  userId: map((rs) => rs.profile.profile.id),
}))(ClearBrowsingData);
