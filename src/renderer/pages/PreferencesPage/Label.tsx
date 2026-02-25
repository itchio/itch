import styled, * as styles from "renderer/styles";
import classNames from "classnames";

const Label = styled.label.attrs(
  (props: { active?: boolean; className?: string }) => ({
    className: classNames(props.className, { active: props.active }),
  })
)`
  background: ${(props) => props.theme.explanation};
  padding: 8px 11px;
  font-size: 14px;
  display: flex;
  align-items: center;

  ${styles.prefChunk};

  &.active {
    ${styles.prefChunkActive};
  }

  input[type="checkbox"] {
    margin-right: 8px;
  }
`;

export default Label;
