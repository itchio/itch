import styled, * as styles from "renderer/styles";
import classNames from "classnames";

interface LabelProps {
  active?: boolean;
  className?: string;
}

const Label = styled.label
  .withConfig({
    shouldForwardProp: (prop: string) => prop !== "active",
  })
  .attrs((props: LabelProps) => ({
    className: classNames(props.className, { active: props.active }),
  }))<LabelProps>`
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
