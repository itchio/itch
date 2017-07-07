import * as React from "react";
import { connect } from "../connect";

import urls from "../../constants/urls";

import format from "../format";

class ProxySettings extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { proxy, proxySource } = this.props;

    return (
      <span className="proxy-settings">
        {format(["preferences.proxy_server_address"])}
        {proxy
          ? <span className="value" data-rh-at="right" data-rh={proxySource}>
              {proxy}
            </span>
          : <span className="value">
              {format(["preferences.proxy_server_source.direct"])}
            </span>}{" "}
        <a href={urls.proxyDocs}>{format(["docs.learn_more"])}</a>
      </span>
    );
  }
}

interface IProps {}

interface IDerivedProps {
  proxy?: string;
  proxySource?: string;
}

export default connect<IProps>(ProxySettings, {
  state: state => ({
    proxy: state.system.proxy,
    proxySource: state.system.proxySource,
  }),
});
