
import * as React from "react";
import * as classNames from "classnames";

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
class Icon extends React.Component<IIconProps, void> {
  render () {
    const {icon, classes, hint, onClick} = this.props;
    if (!icon) {
      return <span/>;
    }

    const className = classNames(`icon icon-${icon}`, classes);
    const hintProps: any = {};
    if (hint) {
      hintProps["data-rh"] = hint;
      hintProps["data-rh-at"] = "top";
    }

    return <span className={className} {...hintProps} onClick={onClick}/>;
  }
}

interface IIconProps {
  icon: string;
  classes?: string[];
  hint?: string;
  onClick?: any;
}

export default Icon;
