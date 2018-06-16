import classNames from "classnames";
import { LocalizedString } from "common/types";
import React from "react";

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
class Icon extends React.PureComponent<Props> {
  render() {
    const { icon, className, hint, ...restProps } = this.props;
    if (!icon) {
      return <span />;
    }

    const finalClassName = classNames(className, `icon icon-${icon}`);

    return (
      <span
        className={finalClassName}
        data-rh={hint ? JSON.stringify(hint) : null}
        data-rh-at="top"
        {...restProps}
      />
    );
  }
}

interface Props {
  icon: string;
  hint?: LocalizedString;
  className?: string;
  onClick?: any;
}

export default Icon;
