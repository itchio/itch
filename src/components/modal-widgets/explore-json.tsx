import * as React from "react";

import { ModalWidgetDiv } from "./modal-widget";

const Inspector = require("react-json-inspector");
import { IModalWidgetProps } from "./index";
import styled, * as styles from "../styles";

class ExploreJson extends React.PureComponent<IProps> {
  render() {
    const params = this.props.modal.widgetParams;
    const { data } = params;

    return (
      <ModalWidgetDiv>
        <JSONTreeContainer>
          <Inspector data={data} cacheResults={false} ignoreCase={true} />
        </JSONTreeContainer>
      </ModalWidgetDiv>
    );
  }
}

const JSONTreeContainer = styled.div`
  width: 100%;
  user-select: initial;

  .json-inspector__leaf_root {
    filter: brightness(150%);
  }

  input[type="search"] {
    ${styles.heavyInput()};
  }
`;

// props

export interface IExploreJsonParams {
  data: any;
}

export interface IExploreJsonResponse {}

interface IProps
  extends IModalWidgetProps<IExploreJsonParams, IExploreJsonResponse> {}

export default ExploreJson;
