
import * as React from "react";
import {connect, I18nProps} from "../connect";

import urls from "../../constants/urls";

class ProxySettings extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, proxy, proxySource} = this.props;

    return <span className="proxy-settings">
      {t("preferences.proxy_server_address")}
      {proxy
        ? <span className="value"
            data-rh-at="right"
            data-rh={proxySource}>
          {proxy}
        </span>
        : <span className="value">
          {t("preferences.proxy_server_source.direct")}
        </span>
      }
      {" "}
      <a href={urls.proxyDocs}>
        {t("docs.learn_more")}
      </a>
    </span>;
  }
}

interface IProps {}

interface IDerivedProps {
  proxy?: string;
  proxySource?: string;
}

export default connect<IProps>(ProxySettings, {
  state: (state) => ({
    proxy: state.system.proxy,
    proxySource: state.system.proxySource,
  }),
});
