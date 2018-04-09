import React from "react";
import classNames from "classnames";
import { connect } from "../connect";

import LoadingCircle from "../basics/loading-circle";

import electron from "electron";

import { T } from "renderer/t";
import { fileSize } from "common/format/filesize";
import { IModalWidgetProps } from "./index";
import { ModalWidgetDiv } from "./modal-widget";
import styled from "renderer/components/styles";
import { partitionForUser } from "common/util/partition-for-user";

class ClearBrowsingData extends React.PureComponent<
  IProps & IDerivedProps,
  IState
> {
  constructor(props: ClearBrowsingData["props"], context) {
    super(props, context);
    this.state = {
      fetchedCacheSize: false,
      clearCache: true,
      clearCookies: false,
    };
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

    ourSession.getCacheSize(cacheSize => {
      this.setState({
        fetchedCacheSize: true,
        cacheSize,
      });
    });
  }

  change(state: Partial<IState>) {
    const mergedState = {
      ...this.state,
      ...state,
    };

    this.props.updatePayload({
      cache: mergedState.clearCache,
      cookies: mergedState.clearCookies,
    });

    this.setState(mergedState);
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
    border-left: 3px solid ${props => props.theme.prefBorder};
    padding: 5px 0;
    padding-left: 5px;
    margin: 3px 0;
    margin-bottom: 10px;
    transition: 0.2s border ease-in-out;

    &:hover {
      cursor: pointer;
    }

    &.active {
      border-color: ${props => props.theme.accent};
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
    color: ${props => props.theme.secondaryText};
  }
`;

// props

export interface IClearBrowsingDataParams {}
export interface IClearBrowsingDataResponse {
  /** whether to clear cookies */
  cookies?: boolean;

  /** whether to clear cache */
  cache?: boolean;
}

interface IProps
  extends IModalWidgetProps<
      IClearBrowsingDataParams,
      IClearBrowsingDataResponse
    > {}

interface IDerivedProps {
  userId: number;
}

interface IState {
  fetchedCacheSize?: boolean;
  cacheSize?: number;

  clearCache?: boolean;
  clearCookies?: boolean;
}

export default connect<IProps>(ClearBrowsingData, {
  state: state => ({
    userId: state.profile.credentials.me.id,
  }),
});
