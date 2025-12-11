import classNames from "classnames";
import { LocalizedString } from "common/types";
import React from "react";

interface Props {
  icon: string;
  hint?: LocalizedString;
  className?: string;
  onClick?: any;
}

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
const Icon = (props: Props) => {
  const { icon, className, hint, ...restProps } = props;
  if (!icon) {
    return <span />;
  }

  const finalClassName = classNames(className, `icon icon-${icon}`);
  const ariaLabel = typeof hint === "string" ? hint : icon;

  return (
    <span
      className={finalClassName}
      data-rh={hint ? JSON.stringify(hint) : null}
      data-rh-at="top"
      {...restProps}
      role="img"
      aria-label={ariaLabel}
    />
  );
};

export default React.memo(Icon);
