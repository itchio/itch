import styled, * as styles from "renderer/styles";

export const BaseBox = styled.div`
  margin: 1em auto;
  line-height: 1.6;
`;

export const Box = styled.div`
  ${styles.boxy};
  max-width: 1200px;

  margin: 1em auto;
  line-height: 1.6;
`;

export const BoxSingle = styled.div`
  ${styles.boxy};

  margin: 1em auto;
  line-height: 1.6;
`;

export const BoxInner = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
`;
