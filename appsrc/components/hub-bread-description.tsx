
import * as React from "react";
import {connect} from "./connect";
import {createStructuredSelector} from "reselect";

import {makeLabel} from "../util/navigation";

import {IState, ITabs, ITabDataSet, ITabData} from "../types";
import {ILocalizer} from "../localizer";

class HubBreadDescription extends React.Component<IHubBreadDescription, void> {
  render () {
    const {t, id, tabData} = this.props;
    const {subtitle, image, imageClass = ""} = (tabData[id] || {}) as ITabData;
    const label = makeLabel(id, tabData);

    const sub = t.format(subtitle);
    let imageStyle: React.CSSProperties;
    if (image) {
      imageStyle = {
        backgroundImage: `url("${image}")`,
      };
    }

    return <section className="description">
      {image
        ? <div className={`description-image ${imageClass}`} style={imageStyle}></div>
        : ""
      }
      <div className="description-titles">
        <h2>{t.format(label)}</h2>
        {sub && sub.length > 0
          ? <h3>{sub}</h3>
          : ""
        }
      </div>
    </section>;
  }
}

interface IHubBreadDescription {
  id: string;
  path: string;
  tabs: ITabs;
  tabData: ITabDataSet;

  t: ILocalizer;
}

const mapStateToProps = createStructuredSelector({
  id: (state: IState) => state.session.navigation.id,
  tabData: (state: IState) => state.session.navigation.tabData,
  market: (state: IState) => state.market,
});

const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(HubBreadDescription);
