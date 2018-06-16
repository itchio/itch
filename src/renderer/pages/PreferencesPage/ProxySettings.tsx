import React from "react";
import { connect } from "renderer/hocs/connect";

import urls from "common/constants/urls";

import { T } from "renderer/t";
import Icon from "renderer/basics/Icon";
import styled from "renderer/styles";

class ProxySettings extends React.PureComponent<Props & DerivedProps> {
  render() {
    const { proxy, proxySource } = this.props;

    return (
      <ProxySettingsSpan>
        <Icon icon="earth" />&nbsp;{T(["preferences.proxy_server_address"])}
        {proxy ? (
          <span className="value" data-rh-at="right" data-rh={proxySource}>
            {proxy}
          </span>
        ) : (
          <span className="value">
            {T(["preferences.proxy_server_source.direct"])}
          </span>
        )}{" "}
        <a href={urls.proxyDocs}>{T(["docs.learn_more"])}</a>
      </ProxySettingsSpan>
    );
  }
}

const ProxySettingsSpan = styled.span`
  display: flex;
  align-items: center;

  .value {
    margin: 0 10px;
    color: ${props => props.theme.baseColors.ivory};
    user-select: initial;
  }
`;

interface Props {}

interface DerivedProps {
  proxy?: string;
  proxySource?: string;
}

export default connect<Props>(
  ProxySettings,
  {
    state: state => ({
      proxy: state.system.proxy,
      proxySource: state.system.proxySource,
    }),
  }
);
