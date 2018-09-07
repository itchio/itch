import styled from "renderer/styles";

export default styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 12px;

  user-select: none;

  /* this scrolls, so we want it to have its own layer */
  will-change: transform;
`;
