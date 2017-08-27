import * as React from "react";

import { IModalWidgetProps, ModalWidgetDiv } from "./modal-widget";

import JSONTree from "react-json-tree";
import theme from "./json-tree-theme";

export default class ExploreJson extends React.PureComponent<IProps> {
  render() {
    const params = this.props.modal.widgetParams as IExploreJsonParams;
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

interface IProps extends IModalWidgetProps {
  params: IExploreJsonParams;
}
