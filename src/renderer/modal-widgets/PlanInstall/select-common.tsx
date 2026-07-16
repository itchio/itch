import styled from "styled-components";
import { singleLine } from "renderer/styles";

export const SelectValueDiv = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  /* allow the row to shrink inside the option/value wrapper so a long
     title can ellipsize instead of overflowing or wrapping */
  min-width: 0;

  /* everything (icons, size tag, spacers) keeps its size; only the title
     gives way, so the filename truncates while the metadata stays visible */
  > * {
    flex-shrink: 0;
  }

  .spacer {
    width: 0.5em;
  }

  .title {
    font-size: 90%;
    ${singleLine};
    flex-shrink: 1;
    min-width: 0;
  }

  .tag {
    color: ${(props) => props.theme.secondaryText};
    text-shadow: none;

    font-size: 80%;
    padding-right: 8px;
    &:last-child {
      padding-right: 0;
    }

    border-radius: ${(props) => props.theme.borderRadii.explanation};
    ${singleLine};
  }

  &.incompatible {
    color: ${(props) => props.theme.secondaryText};

    .icon {
      opacity: 0.7;
    }

    .warning-glyph {
      color: ${(props) => props.theme.caution};
      opacity: 1;
    }
  }

  &.action {
    color: ${(props) => props.theme.secondaryText};

    .action-glyph {
      opacity: 0.8;
      font-size: 90%;
    }
  }
`;
