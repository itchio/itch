import React from "react";
import classNames from "classnames";
import { ILocalizedString } from "common/types";

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
class Icon extends React.PureComponent<IProps> {
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

interface IProps {
  icon: string;
  hint?: ILocalizedString;
  className?: string;
  onClick?: any;
}

export default Icon;
