import styled from "renderer/styles";

//-----------------------------------
// Description
//-----------------------------------

export const TitleBox = styled.div`
  padding: 12px 0;
  align-self: flex-start;

  display: flex;
  flex-direction: column;
  align-self: stretch;
`;

export const Title = styled.div`
  font-size: ${(props) => props.theme.fontSizes.huger};
  font-weight: bold;
  display: flex;
  flex-flow: row wrap;
  align-items: center;
`;

export const TitleBreak = styled.div`
  flex-basis: 100%;
  width: 0;
  height: 0;
  overflow: hidden;
  margin-top: 8px;
`;

export const TitleSpacer = styled.div`
  width: 8px;
`;

export const Desc = styled.div`
  color: ${(props) => props.theme.secondaryText};
`;
