import classNames from "classnames";
import { LocalizedString } from "common/types";
import React from "react";

export interface SvgIconProps {
  hint?: LocalizedString;
  className?: string;
  onClick?: any;
}

interface Props extends SvgIconProps {
  /** accessible name for the icon */
  label: string;
  children: React.ReactNode;
}

/**
 * Base for standalone SVG icons, the successor to the icomoon font glyphs
 * rendered by Icon. Icons are drawn on a 24x24 grid as solid shapes filled
 * with currentColor. The rendered svg is 1em square and carries the "icon"
 * class, so it scales with font-size, inherits text color, and picks up
 * existing .icon styling like a font glyph.
 */
const SvgIcon = (props: Props) => {
  const { className, hint, label, children, ...restProps } = props;

  return (
    <svg
      className={classNames(className, "icon")}
      viewBox="0 0 24 24"
      fill="currentColor"
      width="1em"
      height="1em"
      style={{ verticalAlign: "-0.125em" }}
      data-rh={hint ? JSON.stringify(hint) : null}
      data-rh-at="top"
      {...restProps}
      role="img"
      aria-label={label}
    >
      {children}
    </svg>
  );
};

export default React.memo(SvgIcon);
