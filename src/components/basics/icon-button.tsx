
import * as React from "react";

import Icon from "./icon";
const Ink = require("react-ink");

import styled, * as styles from "../styles";
import {connect, I18nProps} from "../connect";
import {ILocalizedString} from "../../types";

const IconButtonDiv = styled.div`
  display: inline-block;
  ${styles.inkContainer()}
  ${styles.iconButton()}
`;

class IconButton extends React.Component<IProps & I18nProps, void> {
  render () {
    const {t, icon, hint, hintPosition = "top", ...restProps} = this.props;

    return <IconButtonDiv
      data-rh={t.format(hint)}
      data-rh-at={hintPosition}
      {...restProps}>
        <Icon icon={icon}/>
        <Ink/>
    </IconButtonDiv>;
  }
}

interface IProps {
  icon: string;
  hint?: ILocalizedString;
  hintPosition?: "top" | "left" | "right" | "bottom";

  onClick?: any;
}

export default connect<IProps>(IconButton);
