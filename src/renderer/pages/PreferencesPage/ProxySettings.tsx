import urls from "common/constants/urls";
import { ProxySource } from "common/types";
import React from "react";
import Icon from "renderer/basics/Icon";
import { hook } from "renderer/hocs/hook";
import styled from "renderer/styles";
import { T } from "renderer/t";

class ProxySettings extends React.PureComponent<Props> {
  render() {
    const { proxy, proxySource } = this.props;

    return (
      <ProxySettingsSpan>
        <Icon icon="earth" />
        &nbsp;{T(["preferences.proxy_server_address"])}
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
    color: ${(props) => props.theme.baseColors.ivory};
    user-select: initial;
  }
`;

interface Props {
  proxy: string;
  proxySource: ProxySource;
}

export default hook((map) => ({
  proxy: map((rs) => rs.system.proxy),
  proxySource: map((rs) => rs.system.proxySource),
}))(ProxySettings);
