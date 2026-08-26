import React from "react";
import styled from "renderer/styles";

const CheckboxSpan = styled.span`
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  /* pads the 16px box out to a 24px hit target; the negative margin keeps
     the layout box at 16px so surrounding spacing is unaffected */
  padding: 4px;
  margin: -4px;

  input {
    position: absolute;
    inset: 0;
    margin: 0;
    opacity: 0;
    cursor: inherit;
  }

  .box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: 1px solid ${(props) => props.theme.inputBorderFocused};
    border-radius: 2px;
    background: ${(props) => props.theme.inputBackground};

    svg {
      display: block;
    }

    path {
      fill: none;
      stroke: ${(props) => props.theme.baseBackground};
      stroke-width: 2.2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  }

  input:checked + .box {
    background: ${(props) => props.theme.accent};
    border-color: ${(props) => props.theme.accent};
  }

  /* the global focus-visible outline (global-styles/focus.ts) can't reach
     the invisible input, so draw the same ring on the styled box */
  input:focus-visible + .box {
    outline: 2px solid ${(props) => props.theme.accent};
    outline-offset: 2px;
  }

  input:disabled + .box {
    opacity: 0.4;
  }
`;

interface Props {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export default function Checkbox(props: Props) {
  const { checked, onChange, disabled, id, className } = props;
  return (
    <CheckboxSpan className={className}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        id={id}
      />
      <span className="box" aria-hidden>
        {checked ? (
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d="M1.6 5.4 L4.1 7.9 L8.5 2.5" />
          </svg>
        ) : null}
      </span>
    </CheckboxSpan>
  );
}
