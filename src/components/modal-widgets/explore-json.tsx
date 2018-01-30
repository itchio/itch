import * as React from "react";

import { ModalWidgetDiv } from "./modal-widget";

import JSONTree from "react-json-tree";
import theme from "./json-tree-theme";
import { IModalWidgetProps } from "./index";

class ExploreJson extends React.PureComponent<IProps> {
  render() {
    const params = this.props.modal.widgetParams;
    const { data } = params;

    return (
      <ModalWidgetDiv>
        <div className="json-tree-container">
          <JSONTree data={data} theme={theme} invertTheme={false} />
        </div>
      </ModalWidgetDiv>
    );
  }
}

export interface IExploreJsonParams {
  data: any;
}

export interface IExploreJsonResponse {}

interface IProps
  extends IModalWidgetProps<IExploreJsonParams, IExploreJsonResponse> {}

export default ExploreJson;
