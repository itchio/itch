import styled, { animations } from "renderer/styles";

export const ListContainer = styled.div`
  animation: ${animations.fadeIn} 0.2s;

  padding: 1em 0;

  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
`;
