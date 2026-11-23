import urls from "common/constants/urls";
import React from "react";
import Icon from "renderer/basics/Icon";
import { useAppSelector } from "renderer/hooks/redux";
import styled from "renderer/styles";
import { T } from "renderer/t";

const ProxySettingsSpan = styled.span`
  display: flex;
  align-items: center;

  .value {
    margin: 0 10px;
    color: ${(props) => props.theme.baseColors.ivory};
    user-select: initial;
  }
`;

const ProxySettings = () => {
  const proxy = useAppSelector((rs) => rs.system.proxy);
  const proxySource = useAppSelector((rs) => rs.system.proxySource);

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
};

export default ProxySettings;
