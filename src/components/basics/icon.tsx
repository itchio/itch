import * as React from "react";
import * as classNames from "classnames";

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
    const hintProps: any = {};
    if (hint) {
      hintProps["data-rh"] = hint;
      hintProps["data-rh-at"] = "top";
    }

    return <span className={finalClassName} {...hintProps} {...restProps} />;
  }
}

interface IProps {
  icon: string;
  hint?: string;
  className?: string;
  onClick?: any;
}

export default Icon;
