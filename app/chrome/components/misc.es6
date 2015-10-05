
import React from "react";

/**
 * An icon from the icomoon font.
 * Peek in the static/fonts/icomoon/ folder to learn more.
 */
export class Icon extends React.Component {
  render() {
    let {icon} = this.props;

    if (icon) {
      return <span className={`icon icon-${icon}`}/>
    } else {
      return <span/>;
    }
  }
}

/**
 * A bunch of errors displayed in a list
 */
export class ErrorList extends React.Component {
  render() {
    let {errors} = this.props;

    if (!errors) {
      return <div/>;
    }

    return <ul className="form_errors">
      {errors.length ?
        errors.map((error, key) => {
          return <li key={key}>{error}</li>
        })
        :
        <li>{errors}</li>
      }
    </ul>;
  }
}

