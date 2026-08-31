import { ExploreJsonParams, ExploreJsonResponse } from "common/modals/types";
import React from "react";
import { ModalWidgetDiv } from "renderer/modal-widgets/styles";
import styled from "renderer/styles";
import { ModalWidgetProps } from "common/modals";
import JsonInspector from "renderer/basics/JsonInspector";

const ExploreJson = (props: Props) => {
  const { data } = props.modal.widgetParams;

  return (
    <ModalWidgetDiv>
      <JSONTreeContainer>
        <JsonInspector data={data} />
      </JSONTreeContainer>
    </ModalWidgetDiv>
  );
};

const JSONTreeContainer = styled.div`
  width: 100%;
  user-select: text;
`;

interface Props
  extends ModalWidgetProps<ExploreJsonParams, ExploreJsonResponse> {}

export default ExploreJson;
