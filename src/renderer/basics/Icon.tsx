import classNames from "classnames";
import React from "react";

interface Props {
  icon: string;
  className?: string;
  onClick?: any;
}

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
export const Icon = (props: Props) => {
  const { icon, className, ...restProps } = props;
  if (!icon) {
    return <span />;
  }

  const finalClassName = classNames(className, `icon icon-${icon}`);

  return <span className={finalClassName} {...restProps} />;
};
